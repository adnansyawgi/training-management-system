const { makeCatalogueRepository } = require('../../../src/repositories/program-catalogue.repository');
let connection, repository;
beforeEach(() => {
  connection = { query: jest.fn(), execute: jest.fn().mockResolvedValueOnce([[{ total: '0' }]]).mockResolvedValueOnce([[]]), commit: jest.fn(), rollback: jest.fn(), release: jest.fn() };
  repository = makeCatalogueRepository({ pool: { getConnection: jest.fn().mockResolvedValue(connection) } });
});
test('one read-only repeatable snapshot owns both count and rows, with bound filter/limit values', async () => {
  await repository.readPage({ page: 2, pageSize: 20, offset: 20, sort: 'DATE_ASC', categoryId: '2', availability: 'FULL' });
  expect(connection.query.mock.calls).toEqual([['SET TRANSACTION ISOLATION LEVEL REPEATABLE READ'], ['START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY']]);
  const count = connection.execute.mock.calls[0], data = connection.execute.mock.calls[1];
  expect(count[0]).toContain("WHERE status = 'REGISTERED'");
  expect(count[0]).toContain('p.capacity - COALESCE(r.used, 0) <= 0');
  expect(data[0]).toContain('ORDER BY p.training_date ASC, p.program_id ASC LIMIT ? OFFSET ?');
  expect(count[1]).toEqual(['2']); expect(data[1]).toEqual(['2', 20, 20]);
  expect(connection.commit).toHaveBeenCalled(); expect(connection.release).toHaveBeenCalled();
});
test.each(['count', 'rows', 'commit'])('%s failure rolls back and releases the connection', async stage => {
  const error = new Error('fixture failure');
  if (stage === 'count') connection.execute.mockReset().mockRejectedValue(error);
  if (stage === 'rows') connection.execute.mockReset().mockResolvedValueOnce([[{ total: 1 }]]).mockRejectedValueOnce(error);
  if (stage === 'commit') connection.commit.mockRejectedValue(error);
  await expect(repository.readPage({ page: 1, pageSize: 20, offset: 0, sort: 'DATE_ASC' })).rejects.toBe(error);
  expect(connection.rollback).toHaveBeenCalled(); expect(connection.release).toHaveBeenCalled();
});
test('unapproved sort cannot be interpolated into SQL', async () => {
  await expect(repository.readPage({ page: 1, pageSize: 20, offset: 0, sort: 'DROP TABLE users' })).rejects.toThrow('Invalid catalogue binding');
  expect(connection.query).not.toHaveBeenCalled();
});
