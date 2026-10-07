const { makeBootstrapRepository } = require('../../../src/repositories/system-administrator-bootstrap.repository');
const { errors } = require('../../../src/auth/authentication-errors');
let connection, repository;
beforeEach(() => {
  connection = { execute: jest.fn(), beginTransaction: jest.fn(), commit: jest.fn(), rollback: jest.fn(), release: jest.fn(), destroy: jest.fn() };
  repository = makeBootstrapRepository({ pool: { getConnection: async () => connection }, errors, generateIdentifier: () => 'A-generated' });
});
function gate() {
  connection.execute.mockResolvedValueOnce([[{ database_name: 'test_database' }]])
    .mockResolvedValueOnce([[{ acquired: 1 }]]).mockResolvedValueOnce([[{ released: 1 }]]);
}
test('holds the database-scoped gate across the transaction and releases after commit', async () => {
  gate();
  await expect(repository.withExclusiveEligibility(async () => 'result')).resolves.toBe('result');
  expect(connection.execute.mock.calls[1][0]).toContain('GET_LOCK');
  expect(connection.execute.mock.calls[1][1][0].length).toBeLessThanOrEqual(64);
  expect(connection.commit.mock.invocationCallOrder[0]).toBeLessThan(connection.execute.mock.invocationCallOrder[2]);
  expect(connection.release).toHaveBeenCalled();
});
test('rolls back failed writes and releases the gate', async () => {
  gate();
  const error = new Error('audit failure');
  await expect(repository.withExclusiveEligibility(async () => { throw error; })).rejects.toBe(error);
  expect(connection.rollback).toHaveBeenCalled();
  expect(connection.commit).not.toHaveBeenCalled();
  expect(connection.release).toHaveBeenCalled();
});
test('destroys a connection if the advisory lock cannot be released', async () => {
  connection.execute.mockResolvedValueOnce([[{ database_name: 'test' }]]).mockResolvedValueOnce([[{ acquired: 1 }]]).mockRejectedValueOnce(new Error('connection failure'));
  await repository.withExclusiveEligibility(async () => 'result');
  expect(connection.destroy).toHaveBeenCalled();
  expect(connection.release).not.toHaveBeenCalled();
});
test.each(['users.username', 'username', 'users.email', 'email'])('maps verified input constraint %s to 409', async key => {
  connection.execute.mockRejectedValue({ code: 'ER_DUP_ENTRY', sqlMessage: `Duplicate entry 'private-value' for key '${key}'` });
  await expect(repository.createWithIdentifierRetry(connection, {})).rejects.toMatchObject({ status: 409 });
  expect(connection.execute).toHaveBeenCalledTimes(1);
});
test('unknown key containing an email-like duplicate value is not guessed', async () => {
  const error = { code: 'ER_DUP_ENTRY', sqlMessage: "Duplicate entry 'email username' for key 'PRIMARY'" };
  connection.execute.mockRejectedValue(error);
  await expect(repository.createWithIdentifierRetry(connection, {})).rejects.toBe(error);
});
test('retries only generated account identifiers, bounded to three inserts', async () => {
  connection.execute.mockRejectedValue({ code: 'ER_DUP_ENTRY', sqlMessage: "Duplicate entry 'A-generated' for key 'users.account_identifier'" });
  await expect(repository.createWithIdentifierRetry(connection, {})).rejects.toMatchObject({ code: 'ER_DUP_ENTRY' });
  expect(connection.execute).toHaveBeenCalledTimes(3);
});
