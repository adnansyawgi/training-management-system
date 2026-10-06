const ALLOWED_FIELDS = new Set(['nricPassportNo', 'name', 'email', 'mobileNo', 'password']);
const SERVER_CONTROLLED_FIELDS = new Set([
  'userId', 'participantId', 'role', 'roleId', 'roleName', 'status', 'accountStatus',
  'permissions', 'accessScope', 'permittedResponsibilities', 'username', 'accountIdentifier',
  'createdAt', 'updatedAt', 'roleAssignedAt'
]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateParticipantAccount(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(createValidationError([{ field: 'request', message: 'A valid JSON request body is required.' }]));
  }

  const errors = [];
  for (const field of SERVER_CONTROLLED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      errors.push({ field, message: `${field} is server controlled and must not be supplied.` });
    }
  }
  for (const field of Object.keys(body)) {
    if (!ALLOWED_FIELDS.has(field)) {
      errors.push({ field, message: `${field} is not an accepted account creation field.` });
    }
  }

  const nricPassportNo = normalizeString(body.nricPassportNo);
  const name = normalizeString(body.name);
  const email = normalizeString(body.email)?.toLowerCase();
  const mobileNo = normalizeString(body.mobileNo);
  const password = typeof body.password === 'string' ? body.password : null;

  validateRequiredString(errors, 'nricPassportNo', nricPassportNo, 50);
  validateRequiredString(errors, 'name', name, 200);
  validateRequiredString(errors, 'email', email, 254);
  if (email && !EMAIL_PATTERN.test(email)) errors.push({ field: 'email', message: 'Email address must be valid.' });
  validateRequiredString(errors, 'mobileNo', mobileNo, 30);
  validatePassword(errors, password);

  if (errors.length) return next(createValidationError(errors));
  req.validatedBody = { nricPassportNo, name, email, mobileNo, password };
  return next();
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : null;
}

function validateRequiredString(errors, field, value, maxLength) {
  if (!value) return errors.push({ field, message: `${field} is required.` });
  if (value.length > maxLength) errors.push({ field, message: `${field} must not exceed ${maxLength} characters.` });
}

function validatePassword(errors, password) {
  if (!password) return errors.push({ field: 'password', message: 'password is required.' });
  if (password.length < 12) errors.push({ field: 'password', message: 'Password must contain at least 12 characters.' });
  if (!/[A-Z]/.test(password)) errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter.' });
  if (!/[a-z]/.test(password)) errors.push({ field: 'password', message: 'Password must contain at least one lowercase letter.' });
  if (!/[0-9]/.test(password)) errors.push({ field: 'password', message: 'Password must contain at least one digit.' });
  if (!/[^A-Za-z0-9]/.test(password)) errors.push({ field: 'password', message: 'Password must contain at least one non-alphanumeric character.' });
}

function createValidationError(details) {
  const error = new Error('Account creation information is invalid.');
  error.status = 400;
  error.code = 'VALIDATION_ERROR';
  error.details = details;
  return error;
}

module.exports = { validateParticipantAccount };
