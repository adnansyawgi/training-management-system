// src/middleware/implementation-errors.js
// Pass repository-approved code literals; do not reinterpret raw DB errors.
const trusted = Symbol('approved application error');
function makeErrors(codes) {
  const definitions = {
    validation: [400, 'Request information is invalid.'],
    authentication: [401, 'Authentication failed.'],
    forbidden: [403, 'Access is not permitted.'],
    notFound: [404, 'The requested resource is unavailable.'],
    conflict: [409, 'The operation conflicts with current state.'],
    locked: [423, 'Authentication is not permitted.'],
    integrity: [500, 'An unexpected error occurred.']
  };
  const result = {};
  for (const [kind, [status, message]] of Object.entries(definitions)) {
    if (typeof codes?.[kind] !== 'string' || !codes[kind]) throw new Error('Error code binding required.');
    result[kind] = () => Object.assign(new Error(message), {
      status, code: codes[kind], details: null, [trusted]: true
    });
  }
  return result;
}
function makeErrorHandler(approvedStatuses, { wf001Compatibility = false } = {}) {
  const allowed = new Set(approvedStatuses);
  return function(error, req, res, next) {
    if (res.headersSent) return next(error);
    const known = error?.[trusted] === true && allowed.has(error.status);
    // Narrow compatibility for the inspected WF-001 business error constructors.
    // Recognize exact route/code/status, never raw DB status or constraint text.
    const wf001 = wf001Compatibility && req.method === 'POST' &&
      typeof req.originalUrl === 'string' &&
      req.originalUrl.split('?')[0] === '/api/v1/auth/participants';
    let legacy = null;
    if (!known && wf001 && error?.status === 400 && error.code === 'VALIDATION_ERROR') {
      legacy = { status: 400, code: 'VALIDATION_ERROR',
        message: 'Account creation information is invalid.',
        details: Array.isArray(error.details) ? error.details : null };
    } else if (!known && wf001 && error?.status === 409 &&
        error.code === 'ACCOUNT_INFORMATION_CONFLICT') {
      legacy = { status: 409, code: 'ACCOUNT_INFORMATION_CONFLICT',
        message: 'The supplied account information cannot be used.', details: null };
    }
    const mapped = known ? error : legacy;
    const status = mapped?.status ?? 500;
    res.status(status).json({
      code: mapped ? mapped.code : 'INTERNAL_SERVER_ERROR',
      message: mapped ? mapped.message : 'An unexpected error occurred.',
      details: mapped ? mapped.details : null,
      timestamp: new Date().toISOString(), correlationId: req.correlationId ?? null
    });
  };
}
function wrapJsonParser(parser, errors) {
  return (req, res, next) => parser(req, res, error => {
    if (error?.type === 'entity.parse.failed') {
      const invalid = errors.validation();
      invalid.message = 'A valid JSON request body is required.';
      return next(invalid);
    }
    return next(error);
  });
}
module.exports = { makeErrors, makeErrorHandler, wrapJsonParser };
