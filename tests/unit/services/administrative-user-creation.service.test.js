const { makeService } = require('../../../src/services/administrative-user-creation.service');
const { errors } = require('../../../src/auth/authentication-errors');
const { makeResponseCodec } = require('../../../src/utils/implementation-response-codec');
let d;
const input = { username: 'entered', name: 'Staff', email: 'staff@example.test', password: 'StrongPassword@123', role: 'TRAINER' };
const context = { principal: { userId: '12', role: 'SYSTEM_ADMINISTRATOR' }, sessionId: 'session' };
beforeEach(() => {
  d = { transactions: { run: jest.fn(async callback => callback('connection')) }, authorization: { assertCreator: jest.fn() },
    passwords: { hashPassword: jest.fn().mockResolvedValue('hash') }, roles: { resolve: jest.fn().mockResolvedValue({ accountStatus: 'ACTIVE', permissions: ['ATTENDANCE_RECORD'] }) },
    clock: { now: () => new Date('2026-10-07T00:00:00Z') }, accounts: { createWithIdentifierRetry: jest.fn().mockResolvedValue({ userId: '34', accountIdentifier: 'A-generated' }) },
    audit: { accountCreated: jest.fn() }, errors, responseCodec: makeResponseCodec() };
});
test('account and authenticated creator audit use the same transaction', async () => {
  const result = await makeService(d).create(input, context);
  expect(result.role).toBe('TRAINER'); expect(result.username).toBe('entered');
  expect(d.authorization.assertCreator).toHaveBeenCalledWith('connection', context);
  expect(d.roles.resolve).toHaveBeenCalledWith('connection', 'TRAINER');
  expect(d.accounts.createWithIdentifierRetry).toHaveBeenCalledWith('connection', expect.objectContaining({ roleName: 'TRAINER', passwordHash: 'hash', permissions: ['ATTENDANCE_RECORD'] }));
  expect(d.audit.accountCreated).toHaveBeenCalledWith('connection', expect.objectContaining({ actorUserId: '12', userId: '34' }));
});
test('unapproved target role or creator is forbidden before credential work', async () => {
  await expect(makeService(d).create({ ...input, role: 'SYSTEM_ADMINISTRATOR' }, context)).rejects.toMatchObject({ status: 403 });
  await expect(makeService(d).create(input, { principal: { role: 'PARTICIPANT' } })).rejects.toMatchObject({ status: 403 });
  expect(d.passwords.hashPassword).not.toHaveBeenCalled();
});
test('unsafe numeric response identity fails before audit/commit', async () => {
  d.accounts.createWithIdentifierRetry.mockResolvedValue({ userId: '9007199254740993' });
  await expect(makeService(d).create(input, context)).rejects.toThrow('lossless'); expect(d.audit.accountCreated).not.toHaveBeenCalled();
});
