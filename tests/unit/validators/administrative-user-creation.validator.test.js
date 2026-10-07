const { makeValidators } = require('../../../src/validators/administrative-user-creation.validator');
const { errors } = require('../../../src/auth/authentication-errors');
const input = { username: ' entered ', name: ' Staff ', email: ' STAFF@EXAMPLE.TEST ', password: 'StrongPassword@123', role: 'TRAINER' };
const run = body => {
  const req = { body, params: {}, query: {} }; const next = jest.fn();
  makeValidators({ errors }).create(req, {}, next); return { input: req.validatedInput, error: next.mock.calls[0][0] };
};
test('preserves entered username, normalizes account text and leaves credential unchanged', () => {
  expect(run(input)).toEqual({ error: undefined, input: { ...input, username: 'entered', name: 'Staff', email: 'staff@example.test' } });
});
test.each(['username', 'name', 'email', 'password', 'role'])('requires %s', field => {
  const body = { ...input }; delete body[field]; expect(run(body).error.status).toBe(400);
});
test.each([['username', 101], ['name', 201], ['email', 255]])('limits %s', (field, length) => {
  expect(run({ ...input, [field]: 'a'.repeat(length) }).error.status).toBe(400);
});
test.each(['weak', 'lowercase123!', 'UPPERCASE123!', 'NoNumbersHere!', 'NoSymbols1234'])('enforces password policy for %s', password => {
  expect(run({ ...input, password }).error.status).toBe(400);
});
