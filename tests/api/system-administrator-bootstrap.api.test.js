const express = require('../../src/node_modules/express');
const request = require('../../src/node_modules/supertest');
const { assemble } = require('../../src/system-administrator-bootstrap.composition');
const { errors } = require('../../src/auth/authentication-errors');
const errorHandler = require('../../src/middleware/error-handler.middleware');
const correlation = require('../../src/middleware/correlation-id.middleware');
let app, d;
const input = { staticAdministrationKey: 'private-key', username: 'administrator', name: 'Admin', email: 'admin@example.test', password: 'StrongPassword@123' };
beforeEach(() => {
  d = { keys: { verify: jest.fn() }, passwords: { hashPassword: jest.fn().mockResolvedValue('private-hash') },
    bootstrap: { withExclusiveEligibility: jest.fn(async fn => fn({})) }, users: { hasActiveSystemAdministrator: jest.fn().mockResolvedValue(false) },
    roles: { resolve: jest.fn().mockResolvedValue({ accountStatus: 'ACTIVE' }) }, clock: { now: () => new Date('2026-10-07T01:00:00Z') },
    accounts: { createWithIdentifierRetry: jest.fn().mockResolvedValue({ userId: '12', accountIdentifier: 'A-generated' }) }, audit: { bootstrap: jest.fn() } };
  app = express(); app.use(correlation); app.use(express.json());
  app.use('/api/v1', assemble({ repositoriesAndServices: d, requestContext: () => ({}) })); app.use(errorHandler);
});
test('201 returns the exact approved response and creates no session cookie', async () => {
  const result = await request(app).post('/api/v1/auth/system-admin/bootstrap').set('X-Correlation-ID', 'test').send(input).expect(201);
  expect(result.body).toEqual({ userId: 12, accountIdentifier: 'A-generated', username: 'administrator', role: 'SYSTEM_ADMINISTRATOR', accountStatus: 'ACTIVE', createdAt: '2026-10-07T01:00:00.000Z' });
  expect(result.headers['set-cookie']).toBeUndefined();
  expect(result.headers['x-correlation-id']).toBe('test');
});
test('400 rejects server-controlled inputs', async () => {
  await request(app).post('/api/v1/auth/system-admin/bootstrap').send({ ...input, permissions: ['ALL'] }).expect(400);
  expect(d.keys.verify).not.toHaveBeenCalled();
});
test('missing/invalid static key is generic 401', async () => {
  d.keys.verify.mockRejectedValue(errors.authentication());
  const { staticAdministrationKey, ...body } = input;
  const result = await request(app).post('/api/v1/auth/system-admin/bootstrap').send(body).expect(401);
  expect(result.headers['set-cookie']).toBeUndefined();
});
test('409 prevents duplicate active administrator creation', async () => {
  d.users.hasActiveSystemAdministrator.mockResolvedValue(true);
  await request(app).post('/api/v1/auth/system-admin/bootstrap').send(input).expect(409);
  expect(d.accounts.createWithIdentifierRetry).not.toHaveBeenCalled();
});
test('500 sanitizes database/audit failures', async () => {
  d.audit.bootstrap.mockRejectedValue(new Error('SQL private-key private-hash'));
  const result = await request(app).post('/api/v1/auth/system-admin/bootstrap').send(input).expect(500);
  expect(JSON.stringify(result.body)).not.toMatch(/SQL|private-key|private-hash/);
  expect(result.headers['set-cookie']).toBeUndefined();
});
