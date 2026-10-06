const { validateParticipantAccount } = require('../../../src/validators/participant-account.validator');

function run(body) {
  const req = { body };
  let error;
  validateParticipantAccount(req, {}, value => { error = value; });
  return { req, error };
}

test('accepts exactly the five participant fields and normalizes email', () => {
  const { req, error } = run({
    nricPassportNo: ' A123 ', name: ' Jane Tan ', email: ' JANE@EXAMPLE.COM ',
    mobileNo: ' +6012 ', password: 'StrongPassword@123'
  });
  expect(error).toBeUndefined();
  expect(req.validatedBody).toMatchObject({ nricPassportNo: 'A123', name: 'Jane Tan', email: 'jane@example.com' });
});

test('rejects unknown and server-controlled fields', () => {
  const { error } = run({
    nricPassportNo: 'A123', name: 'Jane', email: 'jane@example.com', mobileNo: '012',
    password: 'StrongPassword@123', role: 'ADMIN', extra: true
  });
  expect(error.status).toBe(400);
  expect(error.details.map(item => item.field)).toEqual(expect.arrayContaining(['role', 'extra']));
});

test('enforces the password policy', () => {
  const { error } = run({ nricPassportNo: 'A123', name: 'Jane', email: 'jane@example.com', mobileNo: '012', password: 'weak' });
  expect(error.status).toBe(400);
  expect(error.details.some(item => item.field === 'password')).toBe(true);
});
