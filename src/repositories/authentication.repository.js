const { positiveId } = require('../validators/implementation-validation');

async function findForAuthentication(unit, email) {
  // Serialize security state changes for the same account across app instances.
  const [rows] = await unit.connection.execute(`
    SELECT user_id, password_hash, role_id, role_name, account_status,
      failed_login_count, lockout_until, authentication_method
    FROM users WHERE email = ? LIMIT 1 FOR UPDATE`, [email]);
  if (!rows.length) return null;
  return { ...rows[0], user_id: positiveId(rows[0].user_id) };
}

async function findUniqueByUser(unit, userId) {
  const [rows] = await unit.connection.execute(
    'SELECT participant_id FROM participants WHERE user_id = ? LIMIT 2', [positiveId(userId)]);
  if (rows.length !== 1) throw new Error('Participant profile integrity failure.');
  return { participant_id: positiveId(rows[0].participant_id) };
}

async function recordFailure(unit, user) {
  const { connection, now } = unit;
  const cutoff = new Date(now.getTime() - 15 * 60 * 1000);
  await connection.execute('DELETE FROM authentication_failures WHERE user_id = ? AND attempted_at <= ?', [user.user_id, cutoff]);
  await connection.execute('INSERT INTO authentication_failures (user_id, attempted_at) VALUES (?, ?)', [user.user_id, now]);
  const [rows] = await connection.execute('SELECT COUNT(*) AS failure_count FROM authentication_failures WHERE user_id = ? AND attempted_at > ?', [user.user_id, cutoff]);
  const count = Number(rows[0].failure_count);
  if (!Number.isSafeInteger(count) || count < 1) throw new Error('Invalid failure count.');
  const until = count >= 5 ? new Date(now.getTime() + 15 * 60 * 1000) : null;
  await connection.execute('UPDATE users SET failed_login_count = ?, lockout_until = ?, updated_at = ? WHERE user_id = ?', [count, until, now, user.user_id]);
}

async function recordSuccess(unit, user) {
  await unit.connection.execute('DELETE FROM authentication_failures WHERE user_id = ?', [user.user_id]);
  await unit.connection.execute('UPDATE users SET failed_login_count = 0, lockout_until = NULL, last_login_at = ?, updated_at = ? WHERE user_id = ?', [unit.now, unit.now, user.user_id]);
}

module.exports = { findForAuthentication, findUniqueByUser, recordFailure, recordSuccess };
