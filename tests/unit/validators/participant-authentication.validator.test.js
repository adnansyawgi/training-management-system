const { makeValidators } = require('../../../src/validators/participant-authentication.validator');
const errors = { validation: () => Object.assign(new Error('Invalid'), { status: 400 }) };
const validators = makeValidators({ errors });
function validate(body, query = {}) {
  const req = { body, query, params: {} };
  const next = jest.fn();
  validators.login(req, {}, next);
  return { req, error: next.mock.calls[0][0] };
}
test('normalizes email and preserves passwords without creation complexity rules', () => {
  const result = validate({ email: ' JANE@EXAMPLE.TEST ', password: ' old ' });
  expect(result.error).toBeUndefined();
  expect(result.req.validatedInput).toEqual({ email: 'jane@example.test', password: ' old ' });
});
test.each([null, [], {}, { email: 'invalid', password: 'old' }, { email: 'a@b.test', password: '' }, { email: 'a@b.test', password: 12 }, { email: 'a@b.test', password: 'old', role: 'ADMIN' }])('rejects malformed or client-controlled input %j', body => {
  expect(validate(body).error.status).toBe(400);
});
test('rejects query authority', () => {
  expect(validate({ email: 'a@b.test', password: 'old' }, { userId: '12' }).error.status).toBe(400);
});
