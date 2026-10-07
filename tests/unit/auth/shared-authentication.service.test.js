const { makeAuthenticationService } = require('../../../src/auth/shared-authentication.service');
const ids = require('../../../src/validators/implementation-validation');
let d;
const user = { user_id: '12', role_id: 'PARTICIPANT', role_name: 'PARTICIPANT', password_hash: 'hash' };
const input = { email: 'jane@example.test', password: 'old-password' };
const policy = { roles: ['PARTICIPANT'], participant: true };
beforeEach(() => {
  d = {
    users: { findForAuthentication: jest.fn().mockResolvedValue(user) },
    participants: { findUniqueByUser: jest.fn().mockResolvedValue({ participant_id: '34' }) },
    credentials: { verifyArgon2id: jest.fn().mockResolvedValue(true), verifyAgainstDummyHash: jest.fn() },
    sessions: { prepare: jest.fn().mockResolvedValue({ expiresAt: new Date('2026-10-07T01:00:00Z'), cookiePlan: { internal: true } }) },
    security: {
      coordinateAttempt: jest.fn(async (_email, callback) => callback('transaction')),
      evaluateEligibility: jest.fn().mockResolvedValue(null),
      recordUnknownAttempt: jest.fn(), recordFailure: jest.fn(), recordRoleRejection: jest.fn(), recordSuccess: jest.fn()
    },
    errors: { authentication: () => new Error('Authentication failed.'), integrity: () => new Error('Integrity failure.') }, ids
  };
});
test('derives session identities from the database using one coordinator', async () => {
  const result = await makeAuthenticationService(d)(input, { correlationId: 'test' }, policy);
  expect(result.payload).toEqual({ userId: '12', participantId: '34', role: 'PARTICIPANT', status: 'ACTIVE', expiresAt: expect.any(Date) });
  expect(d.sessions.prepare).toHaveBeenCalledWith('transaction', { correlationId: 'test' }, { userId: '12', participantId: '34', role: 'PARTICIPANT' });
  expect(d.security.recordSuccess).toHaveBeenCalled();
});
test('unknown email uses dummy verification and records an anonymous failure', async () => {
  d.users.findForAuthentication.mockResolvedValue(null);
  await expect(makeAuthenticationService(d)(input, {}, policy)).rejects.toThrow('Authentication failed.');
  expect(d.credentials.verifyAgainstDummyHash).toHaveBeenCalledWith(input.password);
  expect(d.security.recordUnknownAttempt).toHaveBeenCalled();
  expect(d.sessions.prepare).not.toHaveBeenCalled();
});
test('wrong password records failure without creating a session', async () => {
  d.credentials.verifyArgon2id.mockResolvedValue(false);
  await expect(makeAuthenticationService(d)(input, {}, policy)).rejects.toThrow('Authentication failed.');
  expect(d.security.recordFailure).toHaveBeenCalled();
  expect(d.sessions.prepare).not.toHaveBeenCalled();
});
test('wrong role rejects authentication without looking up a participant profile', async () => {
  d.users.findForAuthentication.mockResolvedValue({ ...user, role_id: 'TRAINER' });
  await expect(makeAuthenticationService(d)(input, {}, policy)).rejects.toThrow('Authentication failed.');
  expect(d.security.recordRoleRejection).toHaveBeenCalled();
  expect(d.participants.findUniqueByUser).not.toHaveBeenCalled();
  expect(d.sessions.prepare).not.toHaveBeenCalled();
});
test('blocked eligibility stops credential verification', async () => {
  d.security.evaluateEligibility.mockResolvedValue(new Error('Locked'));
  await expect(makeAuthenticationService(d)(input, {}, policy)).rejects.toThrow('Locked');
  expect(d.credentials.verifyArgon2id).not.toHaveBeenCalled();
});
test('missing participant profile fails closed', async () => {
  d.participants.findUniqueByUser.mockResolvedValue(null);
  await expect(makeAuthenticationService(d)(input, {}, policy)).rejects.toThrow('Integrity failure.');
  expect(d.sessions.prepare).not.toHaveBeenCalled();
});
test.each(['prepare', 'audit', 'commit'])('does not report success on %s failure', async stage => {
  const error = new Error('Persistence failure');
  if (stage === 'prepare') d.sessions.prepare.mockRejectedValue(error);
  if (stage === 'audit') d.security.recordSuccess.mockRejectedValue(error);
  if (stage === 'commit') d.security.coordinateAttempt.mockImplementation(async (_email, callback) => { await callback('transaction'); throw error; });
  await expect(makeAuthenticationService(d)(input, {}, policy)).rejects.toBe(error);
});
