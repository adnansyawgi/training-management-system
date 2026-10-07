const { makeAuthenticationSecurity } = require('../../../src/auth/authentication-security');
const { errors } = require('../../../src/auth/authentication-errors');
const now = new Date('2026-10-07T01:00:00Z');
let connection, d, security;
beforeEach(() => {
  connection = { beginTransaction: jest.fn(), commit: jest.fn(), rollback: jest.fn(), release: jest.fn() };
  d = { pool: { getConnection: jest.fn().mockResolvedValue(connection) },
    repository: { recordFailure: jest.fn(), recordSuccess: jest.fn() },
    audit: { createAuthenticationAudit: jest.fn() }, sessions: { invalidate: jest.fn() }, errors, now: () => now };
  security = makeAuthenticationSecurity(d);
});
test('rejected outcomes commit their security state before returning failure', async () => {
  const failure = errors.authentication();
  const result = await security.coordinateAttempt('a@b.test', async unit => {
    await security.recordFailure(unit, { user_id: '12' }, {});
    return { failure };
  });
  expect(result.failure).toBe(failure);
  expect(connection.commit).toHaveBeenCalledTimes(1);
  expect(connection.rollback).not.toHaveBeenCalled();
  expect(connection.release).toHaveBeenCalledTimes(1);
});
test.each(['audit', 'commit'])('rolls back and invalidates unpublished sessions on %s failure', async stage => {
  const error = new Error('failure');
  if (stage === 'commit') connection.commit.mockRejectedValue(error);
  await expect(security.coordinateAttempt('a@b.test', async unit => {
    unit.preparedSessionIds.push('prepared');
    if (stage === 'audit') throw error;
    return { payload: {} };
  })).rejects.toBe(error);
  expect(connection.rollback).toHaveBeenCalledTimes(1);
  expect(d.sessions.invalidate).toHaveBeenCalledWith('prepared');
  expect(connection.release.mock.invocationCallOrder[0]).toBeLessThan(d.sessions.invalidate.mock.invocationCallOrder[0]);
  expect(connection.release).toHaveBeenCalledTimes(1);
});
test.each([
  ['LOCKED', null, 423], ['DISABLED', null, 423], ['INACTIVE', null, 401],
  ['ACTIVE', new Date('2026-10-07T01:01:00Z'), 423], ['ACTIVE', new Date('2026-10-07T01:00:00Z'), null]
])('maps %s with lockout %s to %s', async (account_status, lockout_until, status) => {
  const result = await security.evaluateEligibility({ connection, now }, { account_status, lockout_until }, {});
  expect(result?.status ?? null).toBe(status);
  expect(d.audit.createAuthenticationAudit).toHaveBeenCalledTimes(status ? 1 : 0);
});
