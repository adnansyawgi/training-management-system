const { makeValidators } = require('../../../src/validators/system-administrator-bootstrap.validator');
const { errors } = require('../../../src/auth/authentication-errors');
const validate = body => {
  const req = { body, params: {}, query: {} };
  const next = jest.fn();
  makeValidators({ errors }).bootstrap(req, {}, next);
  return { error: next.mock.calls[0][0], input: req.validatedInput };
};
const valid = { username: ' administrator ', name: ' Name ', email: ' ADMIN@EXAMPLE.TEST ', password: 'StrongPassword@123' };
test('accepts the four fields, normalizing email and preserving password', () => {
  expect(validate(valid)).toEqual({ error: undefined, input: { ...valid, username: 'administrator', name: 'Name', email: 'admin@example.test' } });
});
test('legacy static key is rejected rather than ignored', () => {
  expect(validate({ ...valid, staticAdministrationKey: 'old-key' }).error.status).toBe(400);
});
test.each(['username', 'name', 'email', 'password'])('requires %s', field => {
  const body = { ...valid }; delete body[field];
  expect(validate(body).error.status).toBe(400);
});
test.each([['username', 101], ['name', 201], ['email', 255]])('enforces %s length', (field, length) => {
  expect(validate({ ...valid, [field]: 'x'.repeat(length) }).error.status).toBe(400);
});
test.each(['short', 'lowercase123!', 'UPPERCASE123!', 'NoNumbersHere!', 'NoSymbols1234'])('enforces password policy for %s', password => {
  expect(validate({ ...valid, password }).error.status).toBe(400);
});
test.each(['role', 'accountStatus', 'permissions', 'accountIdentifier', 'extra'])('rejects client authority field %s', field => {
  expect(validate({ ...valid, [field]: 'value' }).error.status).toBe(400);
});
