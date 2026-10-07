const { makeErrors } = require('../middleware/implementation-errors');
const errorCodes = Object.freeze({
  validation: 'VALIDATION_ERROR', authentication: 'AUTHENTICATION_FAILED',
  forbidden: 'ACCESS_FORBIDDEN', notFound: 'RESOURCE_NOT_FOUND',
  conflict: 'STATE_CONFLICT', locked: 'ACCOUNT_LOCKED_OR_DISABLED',
  integrity: 'INTERNAL_SERVER_ERROR'
});
const errors = makeErrors(errorCodes);
module.exports = { errorCodes, errors };
