const express = require('../../src/node_modules/express');
const request = require('../../src/node_modules/supertest');
const { assemble } = require('../../src/composition/participant-authentication.composition');
const { errorCodes, errors } = require('../../src/auth/authentication-errors');
const { makeErrorHandler, wrapJsonParser } = require('../../src/middleware/implementation-errors');
const correlation = require('../../src/middleware/correlation-id.middleware');
let app, adapters, cookies;
beforeEach(() => {
  adapters = {
    users: { findForAuthentication: jest.fn().mockResolvedValue({ user_id: '12', role_id: 'PARTICIPANT', role_name: 'PARTICIPANT', password_hash: 'private-hash' }) },
    participants: { findUniqueByUser: jest.fn().mockResolvedValue({ participant_id: '34' }) },
    credentials: { verifyArgon2id: jest.fn().mockResolvedValue(true), verifyAgainstDummyHash: jest.fn() },
    security: { coordinateAttempt: jest.fn(async (_email, callback) => callback({})), evaluateEligibility: jest.fn(), recordFailure: jest.fn(), recordSuccess: jest.fn(), recordUnknownAttempt: jest.fn(), recordRoleRejection: jest.fn() },
    sessions: { prepare: jest.fn().mockResolvedValue({ expiresAt: new Date('2026-10-07T01:00:00Z'), cookiePlan: { sessionId: 'internal-session' } }) }
  };
  cookies = { emitCommitted: jest.fn(res => res.cookie('tms.sid', 'signed-cookie', { secure: true, httpOnly: true, sameSite: 'lax' })), discardUnsent: jest.fn() };
  app = express();
  app.use(correlation);
  app.use(wrapJsonParser(express.json(), errors));
  app.use('/api/v1', assemble({ errorCodes, repositoriesAndServices: adapters, requestContext: () => ({}), cookies }));
  app.use(makeErrorHandler([400, 401, 423, 500]));
});
const input = { email: 'jane@example.test', password: 'old' };
test('200 projects only approved fields and emits a secure cookie after commit', async () => {
  const response = await request(app).post('/api/v1/auth/participants/login').set('X-Correlation-ID', 'test').send(input).expect(200);
  expect(response.body).toEqual({ userId: 12, participantId: 34, role: 'PARTICIPANT', status: 'ACTIVE', expiresAt: '2026-10-07T01:00:00.000Z' });
  expect(response.headers['x-correlation-id']).toBe('test');
  expect(response.headers['set-cookie'][0]).toMatch(/HttpOnly; Secure; SameSite=Lax/);
});
test.each([{}, { ...input, username: 'generated' }, { ...input, userId: 12 }])('400 rejects invalid or extra fields %j', async body => {
  const response = await request(app).post('/api/v1/auth/participants/login').send(body).expect(400);
  expect(response.headers['set-cookie']).toBeUndefined();
  expect(adapters.users.findForAuthentication).not.toHaveBeenCalled();
});
test('unknown email and wrong password produce identical generic 401 responses', async () => {
  adapters.users.findForAuthentication.mockResolvedValueOnce(null);
  const unknown = await request(app).post('/api/v1/auth/participants/login').send(input).expect(401);
  adapters.credentials.verifyArgon2id.mockResolvedValueOnce(false);
  const wrong = await request(app).post('/api/v1/auth/participants/login').send(input).expect(401);
  expect(unknown.body.message).toBe(wrong.body.message);
  expect(unknown.body.code).toBe(wrong.body.code);
  expect(cookies.emitCommitted).not.toHaveBeenCalled();
});
test('423 is a trusted sanitized lockout outcome with no cookie', async () => {
  adapters.security.evaluateEligibility.mockResolvedValue(errors.locked());
  const result = await request(app).post('/api/v1/auth/participants/login').send(input).expect(423);
  expect(result.body.message).toBe('Authentication is not permitted.');
  expect(result.headers['set-cookie']).toBeUndefined();
});
test.each(['session', 'audit', 'commit'])('500 on %s failure never emits a cookie or leaks internals', async stage => {
  const error = new Error('SQL private-hash internal-session');
  if (stage === 'session') adapters.sessions.prepare.mockRejectedValue(error);
  if (stage === 'audit') adapters.security.recordSuccess.mockRejectedValue(error);
  if (stage === 'commit') adapters.security.coordinateAttempt.mockImplementation(async (_email, callback) => { await callback({}); throw error; });
  const result = await request(app).post('/api/v1/auth/participants/login').send(input).expect(500);
  expect(result.body.message).toBe('An unexpected error occurred.');
  expect(result.headers['set-cookie']).toBeUndefined();
  expect(JSON.stringify(result.body)).not.toMatch(/SQL|private-hash|internal-session/);
});
test('unrepresentable response identity discards the committed unpublished session', async () => {
  adapters.users.findForAuthentication.mockResolvedValue({ user_id: '9007199254740993', role_id: 'PARTICIPANT', role_name: 'PARTICIPANT', password_hash: 'hash' });
  const result = await request(app).post('/api/v1/auth/participants/login').send(input).expect(500);
  expect(result.headers['set-cookie']).toBeUndefined();
  expect(cookies.discardUnsent).toHaveBeenCalled();
  expect(cookies.emitCommitted).not.toHaveBeenCalled();
});
test('untrusted status/code cannot expose an arbitrary authentication error', async () => {
  adapters.security.coordinateAttempt.mockRejectedValue(Object.assign(new Error('secret'), { status: 401, code: 'RAW' }));
  const result = await request(app).post('/api/v1/auth/participants/login').send(input).expect(500);
  expect(result.body.message).not.toContain('secret');
});
