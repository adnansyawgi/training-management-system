jest.mock('../../../src/config/database', () => ({ getConnection: jest.fn() }));
jest.mock('../../../src/repositories/user.repository', () => ({ findByEmail: jest.fn(), createUser: jest.fn() }));
jest.mock('../../../src/repositories/participant.repository', () => ({ findByNricPassportNo: jest.fn(), createParticipant: jest.fn() }));
jest.mock('../../../src/repositories/audit.repository', () => ({ createParticipantSelfRegistrationAudit: jest.fn() }));
jest.mock('../../../src/auth/participant-role-defaults', () => ({ resolveParticipantRoleDefaults: jest.fn() }));
jest.mock('../../../src/auth/password-hasher', () => ({ hashPassword: jest.fn() }));
jest.mock('../../../src/utils/account-identifier', () => ({ generateParticipantIdentifiers: jest.fn() }));
const pool = require('../../../src/config/database');
const users = require('../../../src/repositories/user.repository');
const participants = require('../../../src/repositories/participant.repository');
const audit = require('../../../src/repositories/audit.repository');
const roles = require('../../../src/auth/participant-role-defaults');
const hasher = require('../../../src/auth/password-hasher');
const identifiers = require('../../../src/utils/account-identifier');
const { createParticipantAccount: create } = require('../../../src/services/participant-account.service');
const input = { name: 'Jane', email: 'jane@example.test', nricPassportNo: 'TEST-1', mobileNo: '+44 123', password: 'StrongPassword@123' };
let connection;
beforeEach(() => {
  jest.resetAllMocks();
  connection = { beginTransaction: jest.fn(), commit: jest.fn(), rollback: jest.fn(), release: jest.fn() };
  pool.getConnection.mockResolvedValue(connection);
  users.findByEmail.mockResolvedValue(null);
  participants.findByNricPassportNo.mockResolvedValue(null);
  users.createUser.mockResolvedValue(10);
  participants.createParticipant.mockResolvedValue(11);
  roles.resolveParticipantRoleDefaults.mockResolvedValue({ permissions: ['PROGRAM_READ'], accessScope: ['OWN'], permittedResponsibilities: ['VIEW'] });
  hasher.hashPassword.mockResolvedValue('argon2-hash');
  identifiers.generateParticipantIdentifiers.mockImplementation(() => ({ accountIdentifier: `P-${identifiers.generateParticipantIdentifiers.mock.calls.length}`, username: 'participant-generated' }));
});

test('commits user, profile and mandatory audit on one connection', async () => {
  const result = await create(input, { correlationId: 'test' });
  expect(result).toEqual({ participantId: 11, status: 'ACTIVE', createdAt: expect.any(String) });
  expect(users.createUser).toHaveBeenCalledWith(connection, expect.objectContaining({ passwordHash: 'argon2-hash', permissions: ['PROGRAM_READ'], accountStatus: 'ACTIVE' }));
  expect(users.createUser.mock.calls[0][1]).not.toHaveProperty('password');
  expect(roles.resolveParticipantRoleDefaults).toHaveBeenCalledWith(connection);
  expect(participants.createParticipant).toHaveBeenCalledWith(connection, expect.objectContaining({ userId: 10 }));
  expect(audit.createParticipantSelfRegistrationAudit).toHaveBeenCalledWith(connection, expect.objectContaining({ participantId: 11, userId: 10, correlationId: 'test' }));
  expect(audit.createParticipantSelfRegistrationAudit.mock.invocationCallOrder[0]).toBeLessThan(connection.commit.mock.invocationCallOrder[0]);
  expect(connection.commit).toHaveBeenCalledTimes(1);
  expect(connection.rollback).not.toHaveBeenCalled();
  expect(connection.release).toHaveBeenCalledTimes(1);
});

test.each(['email', 'nric'])('rejects duplicate %s before starting a transaction', async field => {
  (field === 'email' ? users.findByEmail : participants.findByNricPassportNo).mockResolvedValue({ id: 1 });
  await expect(create(input)).rejects.toMatchObject({ status: 409 });
  expect(pool.getConnection).not.toHaveBeenCalled();
});

test.each(['participant', 'audit', 'role', 'commit'])('rolls back on %s failure and releases the connection', async stage => {
  const operation = { participant: participants.createParticipant, audit: audit.createParticipantSelfRegistrationAudit, role: roles.resolveParticipantRoleDefaults, commit: connection.commit }[stage];
  const error = new Error('injected failure');
  operation.mockRejectedValueOnce(error);
  await expect(create(input)).rejects.toBe(error);
  expect(connection.rollback).toHaveBeenCalledTimes(1);
  expect(connection.release).toHaveBeenCalledTimes(1);
});

test('maps an authoritative uniqueness race to 409 after rollback', async () => {
  participants.createParticipant.mockRejectedValueOnce({ wf001ConflictType: 'PARTICIPANT_EMAIL_OR_NRIC' });
  await expect(create(input)).rejects.toMatchObject({ status: 409 });
  expect(connection.rollback).toHaveBeenCalledTimes(1);
  expect(connection.commit).not.toHaveBeenCalled();
});

test('regenerates identifiers on collision and hashes the password only once', async () => {
  users.createUser.mockRejectedValueOnce({ wf001ConflictType: 'GENERATED_ACCOUNT_IDENTIFIER' });
  await expect(create(input)).resolves.toMatchObject({ participantId: 11 });
  expect(identifiers.generateParticipantIdentifiers).toHaveBeenCalledTimes(2);
  expect(hasher.hashPassword).toHaveBeenCalledTimes(1);
  expect(connection.rollback).toHaveBeenCalledTimes(1);
  expect(connection.release).toHaveBeenCalledTimes(2);
});

test('bounds generated identifier retries at three attempts', async () => {
  users.createUser.mockRejectedValue({ wf001ConflictType: 'GENERATED_ACCOUNT_IDENTIFIER' });
  await expect(create(input)).rejects.toMatchObject({ status: 500, code: 'INTERNAL_SERVER_ERROR' });
  expect(pool.getConnection).toHaveBeenCalledTimes(3);
  expect(connection.rollback).toHaveBeenCalledTimes(3);
  expect(connection.release).toHaveBeenCalledTimes(3);
  expect(connection.commit).not.toHaveBeenCalled();
});
