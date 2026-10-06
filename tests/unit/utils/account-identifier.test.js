const { generateParticipantIdentifiers } = require('../../../src/utils/account-identifier');

test('generates opaque ULID identifiers with approved prefixes', () => {
  const first = generateParticipantIdentifiers();
  const second = generateParticipantIdentifiers();
  expect(first.accountIdentifier).toMatch(/^P-[0-9A-HJKMNP-TV-Z]{26}$/);
  expect(first.username).toMatch(/^participant-[0-9A-HJKMNP-TV-Z]{26}$/);
  expect(first.accountIdentifier).not.toBe(second.accountIdentifier);
  expect(first.username).not.toBe(second.username);
});
