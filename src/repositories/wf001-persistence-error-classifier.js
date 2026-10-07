function normalizeWf001PersistenceError(error) {
  if (!error || error.code !== 'ER_DUP_ENTRY') return error;

  // v1.0 migration uses single-column UNIQUE indexes named after their columns.
  // Read only the key suffix: duplicate values themselves may contain these words.
  const match = /for key ['`]([^'`]+)['`]\s*$/i.exec(error.sqlMessage || error.message || '');
  if (!match) return error;
  const categories = {
    email: 'PARTICIPANT_EMAIL_OR_NRIC',
    'users.email': 'PARTICIPANT_EMAIL_OR_NRIC',
    nric_passport_no: 'PARTICIPANT_EMAIL_OR_NRIC',
    'participants.nric_passport_no': 'PARTICIPANT_EMAIL_OR_NRIC',
    account_identifier: 'GENERATED_ACCOUNT_IDENTIFIER',
    'users.account_identifier': 'GENERATED_ACCOUNT_IDENTIFIER',
    username: 'GENERATED_ACCOUNT_IDENTIFIER',
    'users.username': 'GENERATED_ACCOUNT_IDENTIFIER'
  };
  const category = Object.prototype.hasOwnProperty.call(categories, match[1]) ? categories[match[1]] : null;
  if (!category) return error;
  const normalized = new Error('A unique constraint prevented account creation.');
  normalized.cause = error;
  normalized.wf001ConflictType = category;
  return normalized;
}

module.exports = { normalizeWf001PersistenceError };
