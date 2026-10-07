const express = require('../../src/node_modules/express');
const request = require('../../src/node_modules/supertest');
const { assemble } = require('../../src/composition/system-administrator-authentication.composition');
const { errorCodes, errors } = require('../../src/auth/authentication-errors');
const { makeErrorHandler, wrapJsonParser } = require('../../src/middleware/implementation-errors');
const correlation = require('../../src/middleware/correlation-id.middleware');
let app, adapters, cookies;
const user = { user_id: '12', role_id: 'SYSTEM_ADMINISTRATOR', role_name: 'SYSTEM_ADMINISTRATOR', password_hash: 'private-hash' };
beforeEach(() => {
  adapters = {
    users: { findForAuthentication: jest.fn().mockResolvedValue(user) },
    credentials: { verifyArgon2id: jest.fn().mockResolvedValue(true), verifyAgainstDummyHash: jest.fn() },
    security: { coordinateAttempt: jest.fn(async (_email, callback) => callback({})), evaluateEligibility: jest.fn(),
      recordFailure: jest.fn(), recordSuccess: jest.fn(), recordUnknownAttempt: jest.fn(), recordRoleRejection: jest.fn() },
    sessions: { prepare: jest.fn().mockResolvedValue({ expiresAt: new Date('2026-10-07T01:00:00Z'), cookiePlan: { sessionId: 'internal-session' } }) }
  };
  cookies = { emitCommitted: jest.fn(res => res.cookie('tms.sid', 'signed-cookie', { secure: true, httpOnly: true, sameSite: 'lax' })), discardUnsent: jest.fn() };
  app = express(); app.use(correlation); app.use(wrapJsonParser(express.json(), errors));
  app.use('/api/v1', assemble({ errorCodes, repositoriesAndServices: adapters, requestContext: () => ({}), cookies }));
  app.use(makeErrorHandler([400, 401, 423, 500]));
});
const input = { email: ' ADMIN@EXAMPLE.TEST ', password: 'old' };
const login = body => request(app).post('/api/v1/auth/system-admin/login').set('X-Correlation-ID', 'test').send(body || input);
test('200 returns exactly the administrator response, secure cookie, and server-derived identity', async () => {
  const result = await login().expect(200);
  expect(result.body).toEqual({ userId: 12, role: 'SYSTEM_ADMINISTRATOR', status: 'ACTIVE', expiresAt: '2026-10-07T01:00:00.000Z' });
  expect(result.headers['x-correlation-id']).toBe('test');
  expect(result.headers['set-cookie'][0]).toMatch(/HttpOnly; Secure; SameSite=Lax/);
  expect(adapters.users.findForAuthentication).toHaveBeenCalledWith({}, 'admin@example.test');
  expect(adapters.sessions.prepare).toHaveBeenCalledWith({}, { authenticationRole: 'SYSTEM_ADMINISTRATOR' }, {
    userId: '12', role: 'SYSTEM_ADMINISTRATOR', participantId: undefined
  });
  expect(cookies.emitCommitted.mock.invocationCallOrder[0]).toBeGreaterThan(adapters.security.recordSuccess.mock.invocationCallOrder[0]);
});
test.each([{}, { ...input, username: 'admin' }, { ...input, staticAdministrationKey: 'key' }, { ...input, role: 'SYSTEM_ADMINISTRATOR' }])('400 rejects invalid or extra body %j', async body => {
  const result = await login(body).expect(400);
  expect(result.headers['set-cookie']).toBeUndefined();
  expect(adapters.users.findForAuthentication).not.toHaveBeenCalled();
});
test('wrong credentials and unknown email share generic 401', async () => {
  adapters.users.findForAuthentication.mockResolvedValueOnce(null);
  const unknown = await login().expect(401);
  adapters.credentials.verifyArgon2id.mockResolvedValueOnce(false);
  const wrong = await login().expect(401);
  expect(unknown.body.message).toBe(wrong.body.message);
  expect(adapters.credentials.verifyAgainstDummyHash).toHaveBeenCalledWith('old');
  expect(cookies.emitCommitted).not.toHaveBeenCalled();
});
test.each(['PARTICIPANT', 'TRAINER', 'TRAINING_ADMINISTRATOR'])('rejects %s role through administrator login', async role => {
  adapters.users.findForAuthentication.mockResolvedValue({ ...user, role_id: role, role_name: role });
  await login().expect(401);
  expect(adapters.sessions.prepare).not.toHaveBeenCalled();
});
test('423 uses the existing trusted locked/disabled mapping', async () => {
  adapters.security.evaluateEligibility.mockResolvedValue(errors.locked());
  const result = await login().expect(423);
  expect(result.headers['set-cookie']).toBeUndefined();
});
test.each(['session', 'audit', 'commit'])('%s failure gives sanitized 500 without a cookie', async stage => {
  const error = new Error('SQL private-hash internal-session');
  if (stage === 'session') adapters.sessions.prepare.mockRejectedValue(error);
  if (stage === 'audit') adapters.security.recordSuccess.mockRejectedValue(error);
  if (stage === 'commit') adapters.security.coordinateAttempt.mockImplementation(async (_email, fn) => { await fn({}); throw error; });
  const result = await login().expect(500);
  expect(JSON.stringify(result.body)).not.toMatch(/SQL|private-hash|internal-session/);
  expect(result.headers['set-cookie']).toBeUndefined();
});
test('unsafe numeric response identity invalidates the unpublished session', async () => {
  adapters.users.findForAuthentication.mockResolvedValue({ ...user, user_id: '9007199254740993' });
  await login().expect(500);
  expect(cookies.discardUnsent).toHaveBeenCalled();
  expect(cookies.emitCommitted).not.toHaveBeenCalled();
});
