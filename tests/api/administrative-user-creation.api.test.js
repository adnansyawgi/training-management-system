const express = require('../../src/node_modules/express');
const request = require('../../src/node_modules/supertest');
const { assemble } = require('../../src/administrative-user-creation.composition');
const { makeSessionSecurity } = require('../../src/middleware/session-security');
const { errors } = require('../../src/auth/authentication-errors');
const errorHandler = require('../../src/middleware/error-handler.middleware');
const correlation = require('../../src/middleware/correlation-id.middleware');
let app, d, sessions, securityAudit;
const token = 'c'.repeat(64);
const input = { username: 'entered-staff', name: 'Staff', email: 'staff@example.test', password: 'StrongPassword@123', role: 'TRAINER' };
beforeEach(() => {
  sessions = { load: jest.fn().mockResolvedValue({ userId: '12', role: 'SYSTEM_ADMINISTRATOR', csrfToken: token }), readId: () => 'internal-session' };
  securityAudit = { csrfRejected: jest.fn() };
  const security = makeSessionSecurity({ sessions, errors, audit: securityAudit });
  d = { transactions: { run: jest.fn(async callback => callback('connection')) }, authorization: { assertCreator: jest.fn() },
    roles: { resolve: jest.fn().mockResolvedValue({ accountStatus: 'ACTIVE' }) }, passwords: { hashPassword: jest.fn().mockResolvedValue('private-hash') },
    clock: { now: () => new Date('2026-10-07T01:00:00Z') }, accounts: { createWithIdentifierRetry: jest.fn().mockResolvedValue({ userId: '34', accountIdentifier: 'A-generated' }) },
    audit: { accountCreated: jest.fn() } };
  app = express(); app.use(correlation); app.use(express.json());
  app.use('/api/v1', assemble({ repositoriesAndServices: d, security,
    requestContext: req => ({ principal: req.principal, sessionId: req.authenticatedSessionId }) })); app.use(errorHandler);
});
const create = (body = input, csrf = token) => request(app).post('/api/v1/admin/users').set('X-CSRF-Token', csrf).send(body);
test.each(['TRAINER', 'TRAINING_ADMINISTRATOR'])('201 creates %s with exact response and authenticated audit actor', async role => {
  const result = await create({ ...input, role }).expect(201);
  expect(result.body).toEqual({ userId: 34, accountIdentifier: 'A-generated', username: input.username, name: input.name, email: input.email,
    role, accountStatus: 'ACTIVE', createdAt: '2026-10-07T01:00:00.000Z' });
  expect(result.headers['set-cookie']).toBeUndefined();
  expect(d.audit.accountCreated).toHaveBeenCalledWith('connection', expect.objectContaining({ actorUserId: '12', userId: '34' }));
});
test('missing/expired session returns generic 401 before account handling', async () => {
  sessions.load.mockResolvedValue(null); await create().expect(401); expect(d.passwords.hashPassword).not.toHaveBeenCalled();
});
test.each(['PARTICIPANT', 'TRAINER', 'TRAINING_ADMINISTRATOR'])('403 denies %s creator', async role => {
  sessions.load.mockResolvedValue({ userId: '12', role, csrfToken: token }); await create().expect(403);
  expect(d.passwords.hashPassword).not.toHaveBeenCalled();
});
test.each(['', 'wrong', 'a'.repeat(64)])('invalid CSRF %s is audited and rejected before hashing', async csrf => {
  await create(input, csrf).expect(403);
  expect(securityAudit.csrfRejected).toHaveBeenCalled(); expect(d.passwords.hashPassword).not.toHaveBeenCalled();
});
test.each(['PARTICIPANT', 'SYSTEM_ADMINISTRATOR', 'UNKNOWN'])('unsupported target role %s is 403', async role => {
  await create({ ...input, role }).expect(403); expect(d.accounts.createWithIdentifierRetry).not.toHaveBeenCalled();
});
test.each(['permissions', 'accountStatus', 'actorUserId', 'accountIdentifier'])('server controlled field %s is 400', async field => {
  await create({ ...input, [field]: 'untrusted' }).expect(400);
});
test('duplicate account information returns trusted 409', async () => {
  d.accounts.createWithIdentifierRetry.mockRejectedValue(errors.conflict()); await create().expect(409);
});
test.each(['user', 'audit'])('%s failure is sanitized 500 without a password/hash in the response', async stage => {
  (stage === 'user' ? d.accounts.createWithIdentifierRetry : d.audit.accountCreated).mockRejectedValue(new Error('SQL private-hash StrongPassword@123'));
  const result = await create().expect(500); expect(JSON.stringify(result.body)).not.toMatch(/SQL|private-hash|StrongPassword/);
});
test('transaction-time creator eligibility rejection cannot create an account', async () => {
  d.authorization.assertCreator.mockRejectedValue(errors.forbidden()); await create().expect(403);
  expect(d.accounts.createWithIdentifierRetry).not.toHaveBeenCalled();
});
