function normalizeWf001PersistenceError(error) {
  if (!error || error.code !== 'ER_DUP_ENTRY') return error;

  const constraint = String(error.sqlMessage || error.message || '').toLowerCase();
  const normalized = new Error('A unique constraint prevented account creation.');
  normalized.cause = error;
  normalized.wf001ConflictType = /email|nric_passport_no|nric|passport/.test(constraint)
    ? 'PARTICIPANT_EMAIL_OR_NRIC'
    : /account_identifier|username/.test(constraint)
      ? 'GENERATED_ACCOUNT_IDENTIFIER'
      : undefined;
  return normalized;
}

module.exports = { normalizeWf001PersistenceError };
