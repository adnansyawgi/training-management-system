const { normalizeWf001PersistenceError: classify } = require('../../../src/repositories/wf001-persistence-error-classifier');

test.each([
  ['email', 'PARTICIPANT_EMAIL_OR_NRIC'],
  ['users.email', 'PARTICIPANT_EMAIL_OR_NRIC'],
  ['participants.nric_passport_no', 'PARTICIPANT_EMAIL_OR_NRIC'],
  ['nric_passport_no', 'PARTICIPANT_EMAIL_OR_NRIC'],
  ['users.username', 'GENERATED_ACCOUNT_IDENTIFIER'],
  ['account_identifier', 'GENERATED_ACCOUNT_IDENTIFIER']
])('classifies the migration key %s', (key, category) => {
  const result = classify({ code: 'ER_DUP_ENTRY', sqlMessage: `Duplicate entry 'email passport username' for key '${key}'` });
  expect(result.wf001ConflictType).toBe(category);
  expect(result.message).not.toContain(key);
});

test.each(['PRIMARY', 'user_id', 'other.email', 'email_archive'])('does not guess unknown key %s from the duplicate value', key => {
  const error = { code: 'ER_DUP_ENTRY', sqlMessage: `Duplicate entry 'email nric passport username' for key '${key}'` };
  expect(classify(error)).toBe(error);
});

test('preserves unparseable and non-duplicate errors', () => {
  for (const error of [null, new Error('email failure'), { code: 'ER_DUP_ENTRY', message: 'email' }]) {
    expect(classify(error)).toBe(error);
  }
});
