jest.mock('../../src/services/participant-account.service', () => ({ createParticipantAccount: jest.fn() }));
const request = require('../../src/node_modules/supertest');
const service = require('../../src/services/participant-account.service');
const app = require('../../src/app');
const input = { name: 'Jane', email: 'jane@example.test', nricPassportNo: 'TEST-1', mobileNo: '+44 123', password: 'StrongPassword@123' };
beforeEach(() => jest.resetAllMocks());

test('201 returns only the approved fields with correlation and no session', async () => {
  service.createParticipantAccount.mockResolvedValue({ participantId: 11, status: 'ACTIVE', createdAt: '2026-10-07T00:00:00.000Z', passwordHash: 'must-not-leak' });
  const response = await request(app).post('/api/v1/auth/participants').set('X-Correlation-ID', 'test-id').send(input).expect(201);
  expect(Object.keys(response.body).sort()).toEqual(['createdAt', 'participantId', 'status']);
  expect(response.headers['x-correlation-id']).toBe('test-id');
  expect(response.headers['set-cookie']).toBeUndefined();
});

test('400 rejects invalid input without calling persistence', async () => {
  await request(app).post('/api/v1/auth/participants').send({ ...input, roleId: 'ADMIN' }).expect(400);
  expect(service.createParticipantAccount).not.toHaveBeenCalled();
});

test('malformed JSON is sanitized and retains correlation', async () => {
  const response = await request(app).post('/api/v1/auth/participants').set('X-Correlation-ID', 'parse-test').set('Content-Type', 'application/json').send('{"password":"private-secret",').expect(400);
  expect(response.body.correlationId).toBe('parse-test');
  expect(response.body.message).toBe('A valid JSON request body is required.');
  expect(JSON.stringify(response.body)).not.toContain('private-secret');
});

test.each([409, 500])('%s sanitizes internal error details', async status => {
  service.createParticipantAccount.mockRejectedValue(Object.assign(new Error('SQL password TEST-1 private-secret'), { status, code: status === 409 ? 'ACCOUNT_INFORMATION_CONFLICT' : 'INTERNAL_TEST' }));
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const response = await request(app).post('/api/v1/auth/participants').send(input).expect(status);
    expect(Object.keys(response.body).sort()).toEqual(['code', 'correlationId', 'details', 'message', 'timestamp']);
    expect(JSON.stringify(response.body)).not.toMatch(/SQL|password|TEST-1|private-secret/);
    expect(response.body.details).toBeNull();
    expect(response.headers['set-cookie']).toBeUndefined();
  } finally { log.mockRestore(); }
});
