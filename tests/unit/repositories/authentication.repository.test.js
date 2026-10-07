const repository = require('../../../src/repositories/authentication.repository');
test('locks account state using a parameterized email lookup', async () => {
  const connection = { execute: jest.fn().mockResolvedValue([[{ user_id: '12' }]]) };
  const result = await repository.findForAuthentication({ connection }, "email' OR 1=1");
  expect(result.user_id).toBe('12');
  expect(connection.execute.mock.calls[0][0]).toContain('FOR UPDATE');
  expect(connection.execute.mock.calls[0][0]).not.toContain("email' OR 1=1");
  expect(connection.execute.mock.calls[0][1]).toEqual(["email' OR 1=1"]);
});
test.each([[[]], [[{ participant_id: '1' }, { participant_id: '2' }]]])('requires exactly one linked participant', async rows => {
  const connection = { execute: jest.fn().mockResolvedValue([rows]) };
  await expect(repository.findUniqueByUser({ connection }, '12')).rejects.toThrow('integrity');
});
test.each([4, 5])('counts only the rolling window and locks after %s failures as required', async count => {
  const connection = { execute: jest.fn().mockResolvedValueOnce([{}]).mockResolvedValueOnce([{}]).mockResolvedValueOnce([[{ failure_count: count }]]).mockResolvedValueOnce([{}]) };
  const now = new Date('2026-10-07T01:00:00Z');
  await repository.recordFailure({ connection, now }, { user_id: '12' });
  expect(connection.execute.mock.calls[0][1]).toEqual(['12', new Date('2026-10-07T00:45:00Z')]);
  expect(connection.execute.mock.calls[3][1]).toEqual([count, count === 5 ? new Date('2026-10-07T01:15:00Z') : null, now, '12']);
});
test('successful login resets security state and updates last-login timestamp', async () => {
  const connection = { execute: jest.fn().mockResolvedValue([{}]) };
  const now = new Date();
  await repository.recordSuccess({ connection, now }, { user_id: '12' });
  expect(connection.execute.mock.calls[0][0]).toContain('DELETE FROM authentication_failures');
  expect(connection.execute.mock.calls[1][0]).toContain('failed_login_count = 0, lockout_until = NULL, last_login_at = ?');
  expect(connection.execute.mock.calls[1][1]).toEqual([now, now, '12']);
});
