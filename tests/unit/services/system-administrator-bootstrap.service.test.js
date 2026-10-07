const { makeService } = require('../../../src/services/system-administrator-bootstrap.service');
const { errors } = require('../../../src/auth/authentication-errors');
const { makeResponseCodec } = require('../../../src/utils/implementation-response-codec');
const input = { username: 'entered-admin', name: 'Admin', email: 'admin@example.test', password: 'StrongPassword@123' };
let d;
beforeEach(() => {
  d = { approvedEmail: { verify: jest.fn() }, passwords: { hashPassword: jest.fn().mockResolvedValue('argon2-hash') },
    bootstrap: { withExclusiveEligibility: jest.fn(async callback => callback('connection')), findBootstrapCompletionState: jest.fn().mockResolvedValue({completed_at:null}), markBootstrapCompleted: jest.fn() },
    users: { hasActiveSystemAdministrator: jest.fn().mockResolvedValue(false) },
    roles: { resolve: jest.fn().mockResolvedValue({ accountStatus: 'ACTIVE', permissions: ['ADMIN_USER_CREATE'], accessScope: ['ALL_ADMINISTRATIVE_USERS'], permittedResponsibilities: ['MANAGE_ADMINISTRATIVE_USERS'] }) },
    clock: { now: () => new Date('2026-10-07T01:00:00Z') }, accounts: { createWithIdentifierRetry: jest.fn().mockResolvedValue({ userId: '12', accountIdentifier: 'A-generated' }) },
    audit: { bootstrap: jest.fn(), bootstrapRejected: jest.fn() }, errors, responseCodec: makeResponseCodec() };
});
test('preserves entered username and atomically creates canonical account/audit without secrets', async () => {
  const result = await makeService(d).bootstrap(input, { correlationId: 'test' });
  expect(result).toEqual({ userId: '12', accountIdentifier: 'A-generated', username: 'entered-admin', role: 'SYSTEM_ADMINISTRATOR', accountStatus: 'ACTIVE', createdAt: '2026-10-07T01:00:00.000Z' });
  expect(d.accounts.createWithIdentifierRetry).toHaveBeenCalledWith('connection', expect.objectContaining({ username: 'entered-admin', roleId: 'SYSTEM_ADMINISTRATOR', passwordHash: 'argon2-hash' }));
  expect(d.accounts.createWithIdentifierRetry.mock.calls[0][1]).not.toHaveProperty('password');
  expect(d.audit.bootstrap.mock.calls[0][1]).not.toHaveProperty('staticAdministrationKey');
  expect(d.roles.resolve).toHaveBeenCalledWith('connection', 'SYSTEM_ADMINISTRATOR');
});
test('incorrect email rejects under the gate before hashing and records rejection', async () => {
  d.approvedEmail.verify.mockRejectedValue(errors.authentication());
  await expect(makeService(d).bootstrap(input, {})).rejects.toMatchObject({ status: 401 });
  expect(d.passwords.hashPassword).not.toHaveBeenCalled();
  expect(d.bootstrap.withExclusiveEligibility).toHaveBeenCalled();
  expect(d.audit.bootstrapRejected).toHaveBeenCalledWith({});
});
test('existing active administrator rejects before any account insert', async () => {
  d.users.hasActiveSystemAdministrator.mockResolvedValue(true);
  await expect(makeService(d).bootstrap(input, {})).rejects.toMatchObject({ status: 409 });
  expect(d.accounts.createWithIdentifierRetry).not.toHaveBeenCalled();
});
test.each(['account', 'audit', 'role'])('%s persistence failure never returns success', async stage => {
  const error = new Error('failure');
  ({ account: d.accounts.createWithIdentifierRetry, audit: d.audit.bootstrap, role: d.roles.resolve })[stage].mockRejectedValue(error);
  await expect(makeService(d).bootstrap(input, {})).rejects.toBe(error);
});
test('unsafe response ID fails before audit/commit rather than rounding', async () => {
  d.accounts.createWithIdentifierRetry.mockResolvedValue({ userId: '9007199254740993', accountIdentifier: 'A-generated' });
  await expect(makeService(d).bootstrap(input, {})).rejects.toThrow('lossless');
  expect(d.audit.bootstrap).not.toHaveBeenCalled();
});
