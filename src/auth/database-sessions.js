const { randomBytes, createHmac, timingSafeEqual } = require('node:crypto');
const { readAuthenticationConfig } = require('../config/authentication');
const { positiveId, sameId } = require('../validators/implementation-validation');

function makeDatabaseSessions({ pool, config = readAuthenticationConfig, now = () => new Date() }) {
  const options = () => ({ path: '/', httpOnly: true, secure: config().secure, sameSite: 'lax' });
  const sign = id => createHmac('sha256', config().secret).update(id).digest('base64url');
  function readId(req) {
    if (!req.headers.cookie) return null;
    const entry = String(req.headers.cookie || '').split(';').map(part => part.trim())
      .find(part => part.startsWith(config().cookieName + '='));
    if (!entry) return null;
    let value;
    try { value = decodeURIComponent(entry.slice(entry.indexOf('=') + 1)); } catch { return null; }
    const match = /^([a-f0-9]{64})\.([A-Za-z0-9_-]{43})$/.exec(value);
    if (!match) return null;
    const expected = Buffer.from(sign(match[1]));
    const supplied = Buffer.from(match[2]);
    return supplied.length === expected.length && timingSafeEqual(supplied, expected) ? match[1] : null;
  }
  async function invalidate(sessionId) {
    await pool.execute('DELETE FROM sessions WHERE session_id = ?', [sessionId]);
  }
  return {
    readId, invalidate,
    async prepare(unit, context, principal) {
      const cfg = config();
      const sessionId = randomBytes(32).toString('hex');
      const expiresAt = new Date(unit.now.getTime() + cfg.idleMs);
      const absoluteExpiresAt = new Date(unit.now.getTime() + cfg.absoluteMs);
      const data = { ...principal, absoluteExpiresAt: absoluteExpiresAt.toISOString(), csrfToken: randomBytes(32).toString('hex') };
      await unit.connection.execute('INSERT INTO sessions (session_id, user_id, session_data, expires_at) VALUES (?, ?, ?, ?)',
        [sessionId, principal.userId, JSON.stringify(data), expiresAt]);
      unit.preparedSessionIds.push(sessionId);
      // A fresh identifier replaces the previous browser session only on successful commit.
      if (context.previousSessionId) {
        await unit.connection.execute('DELETE FROM sessions WHERE session_id = ?', [context.previousSessionId]);
      }
      return { expiresAt, cookiePlan: { sessionId, value: `${sessionId}.${sign(sessionId)}` } };
    },
    emitCommitted(res, plan) {
      if (!plan) throw new Error('Committed session plan required.');
      res.cookie(config().cookieName, plan.value, options());
    },
    async discardUnsent(res, plan) {
      // Preserve cookies belonging to other middleware; remove only this staged cookie.
      const header = res.getHeader('Set-Cookie');
      if (header) {
        const remaining = (Array.isArray(header) ? header : [header]).filter(value => !String(value).startsWith(config().cookieName + '='));
        if (remaining.length) res.setHeader('Set-Cookie', remaining);
        else res.removeHeader('Set-Cookie');
      }
      await invalidate(plan.sessionId);
    },
    async load(req) {
      const sessionId = readId(req);
      if (!sessionId) return null;
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [rows] = await connection.execute('SELECT user_id, session_data, expires_at FROM sessions WHERE session_id = ? FOR UPDATE', [sessionId]);
        const current = now();
        let principal = null;
        if (rows.length && new Date(rows[0].expires_at).getTime() > current.getTime()) {
          const data = JSON.parse(rows[0].session_data);
          const absolute = new Date(data.absoluteExpiresAt);
          if (Number.isFinite(absolute.getTime()) && absolute > current && sameId(rows[0].user_id, data.userId)) {
            const [users] = await connection.execute('SELECT role_id, role_name, account_status, authentication_method, lockout_until FROM users WHERE user_id = ?', [positiveId(data.userId)]);
            const user = users[0];
            const [profiles] = await connection.execute('SELECT participant_id FROM participants WHERE user_id = ? LIMIT 2', [data.userId]);
            const participant = data.role === 'PARTICIPANT';
            const supportedRole = participant || ['SYSTEM_ADMINISTRATOR', 'TRAINING_ADMINISTRATOR', 'TRAINER'].includes(data.role);
            const validProfile = participant
              ? profiles.length === 1 && sameId(profiles[0].participant_id, data.participantId)
              : profiles.length === 0 && data.participantId === undefined;
            if (supportedRole && user?.role_id === data.role && user.role_name === user.role_id && user.account_status === 'ACTIVE' &&
                user.authentication_method !== 'SYSTEM' && (!user.lockout_until || new Date(user.lockout_until) <= current) &&
                validProfile &&
                typeof data.csrfToken === 'string' && /^[a-f0-9]{64}$/.test(data.csrfToken)) {
              const expiresAt = new Date(Math.min(current.getTime() + config().idleMs, absolute.getTime()));
              await connection.execute('UPDATE sessions SET expires_at = ? WHERE session_id = ?', [expiresAt, sessionId]);
              principal = { userId: positiveId(data.userId), role: data.role, csrfToken: data.csrfToken };
              if (participant) principal.participantId = positiveId(data.participantId);
            }
          }
        }
        if (!principal) await connection.execute('DELETE FROM sessions WHERE session_id = ?', [sessionId]);
        await connection.commit();
        return principal;
      } catch (error) {
        try { await connection.rollback(); } catch { /* preserve error */ }
        throw error;
      } finally { connection.release(); }
    },
    async purgeExpired() {
      await pool.execute('DELETE FROM sessions WHERE expires_at <= ?', [now()]);
    }
  };
}
module.exports = { makeDatabaseSessions };
