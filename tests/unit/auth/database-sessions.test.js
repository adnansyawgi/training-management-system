const { makeDatabaseSessions } = require('../../../src/auth/database-sessions');
const cfg = { secret: 'a'.repeat(64), secure: true, cookieName: 'tms.sid', idleMs: 1800000, absoluteMs: 28800000 };
const instant = new Date('2026-10-07T01:00:00Z');
let connection, pool, sessions;
beforeEach(() => {
  connection = { execute: jest.fn().mockResolvedValue([{}]), beginTransaction: jest.fn(), commit: jest.fn(), rollback: jest.fn(), release: jest.fn() };
  pool = { getConnection: jest.fn().mockResolvedValue(connection), execute: jest.fn() };
  sessions = makeDatabaseSessions({ pool, config: () => cfg, now: () => instant });
});
async function prepare() {
  return sessions.prepare({ connection, now: instant, preparedSessionIds: [] }, {}, { userId: '12', participantId: '34', role: 'PARTICIPANT' });
}
test('prepares a random signed session and server-managed CSRF token without emitting cookies', async () => {
  const prepared = await prepare();
  const [sql, values] = connection.execute.mock.calls[0];
  expect(sql).toContain('INSERT INTO sessions');
  expect(values[0]).toMatch(/^[a-f0-9]{64}$/);
  const data = JSON.parse(values[2]);
  expect(data.csrfToken).toMatch(/^[a-f0-9]{64}$/);
  expect(data.absoluteExpiresAt).toBe('2026-10-07T09:00:00.000Z');
  expect(prepared.expiresAt.toISOString()).toBe('2026-10-07T01:30:00.000Z');
  expect(sessions.readId({ headers: { cookie: 'tms.sid=' + prepared.cookiePlan.value } })).toBe(values[0]);
  expect(sessions.readId({ headers: { cookie: 'tms.sid=' + prepared.cookiePlan.value.slice(0, -1) + '!' } })).toBeNull();
});
test('emits only an HttpOnly Secure SameSite=Lax cookie', async () => {
  const prepared = await prepare();
  const res = { cookie: jest.fn() };
  sessions.emitCommitted(res, prepared.cookiePlan);
  expect(res.cookie).toHaveBeenCalledWith('tms.sid', prepared.cookiePlan.value, { path: '/', httpOnly: true, secure: true, sameSite: 'lax' });
});
test('discards the staged authentication cookie and invalidates only its session', async () => {
  const res = { getHeader: () => ['other=value', 'tms.sid=unpublished'], setHeader: jest.fn(), removeHeader: jest.fn() };
  await sessions.discardUnsent(res, { sessionId: 'session-to-delete' });
  expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', ['other=value']);
  expect(pool.execute).toHaveBeenCalledWith('DELETE FROM sessions WHERE session_id = ?', ['session-to-delete']);
});
test.each(['idle', 'absolute', 'disabled', 'wrong-role', 'missing-profile'])('rejects a session with %s invalidity', async reason => {
  const prepared = await prepare();
  const data = { userId: '12', participantId: '34', role: 'PARTICIPANT', csrfToken: 'c'.repeat(64), absoluteExpiresAt: reason === 'absolute' ? instant.toISOString() : '2026-10-07T09:00:00Z' };
  connection.execute.mockReset().mockResolvedValue([{}]);
  connection.execute.mockResolvedValueOnce([[{ user_id: '12', session_data: JSON.stringify(data), expires_at: reason === 'idle' ? instant : new Date('2026-10-07T01:30:00Z') }]]);
  if (reason !== 'idle' && reason !== 'absolute') {
    connection.execute.mockResolvedValueOnce([[{ role_id: reason === 'wrong-role' ? 'TRAINER' : 'PARTICIPANT', account_status: reason === 'disabled' ? 'DISABLED' : 'ACTIVE', authentication_method: 'PASSWORD' }]])
      .mockResolvedValueOnce([reason === 'missing-profile' ? [] : [{ participant_id: '34' }]]);
  }
  await expect(sessions.load({ headers: { cookie: 'tms.sid=' + prepared.cookiePlan.value } })).resolves.toBeNull();
  expect(connection.execute.mock.calls.at(-1)[0]).toContain('DELETE FROM sessions');
  expect(connection.commit).toHaveBeenCalled();
});
test('refreshes idle expiry without exceeding the absolute deadline', async () => {
  const prepared = await prepare();
  const data = { userId: '12', participantId: '34', role: 'PARTICIPANT', csrfToken: 'c'.repeat(64), absoluteExpiresAt: '2026-10-07T01:10:00Z' };
  connection.execute.mockReset().mockResolvedValue([{}]);
  connection.execute.mockResolvedValueOnce([[{ user_id: '12', session_data: JSON.stringify(data), expires_at: new Date('2026-10-07T01:05:00Z') }]])
    .mockResolvedValueOnce([[{ role_id: 'PARTICIPANT', account_status: 'ACTIVE', authentication_method: 'PASSWORD' }]])
    .mockResolvedValueOnce([[{ participant_id: '34' }]]);
  const principal = await sessions.load({ headers: { cookie: 'tms.sid=' + prepared.cookiePlan.value } });
  expect(principal).toEqual({ userId: '12', participantId: '34', role: 'PARTICIPANT', csrfToken: 'c'.repeat(64) });
  expect(connection.execute.mock.calls.at(-1)[1][0].toISOString()).toBe('2026-10-07T01:10:00.000Z');
});
