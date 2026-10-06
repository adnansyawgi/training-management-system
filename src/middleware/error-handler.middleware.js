function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const correlationId = req.correlationId || null;
  if (error.status === 400) {
    return res.status(400).json({
      code: error.code || 'VALIDATION_ERROR',
      message: error.message || 'Account creation information is invalid.',
      details: error.details || null,
      timestamp: new Date().toISOString(),
      correlationId
    });
  }

  if (error.status === 409) {
    return res.status(409).json({
      code: error.code || 'ACCOUNT_INFORMATION_CONFLICT',
      message: 'The supplied account information cannot be used.',
      details: null,
      timestamp: new Date().toISOString(),
      correlationId
    });
  }

  console.error('Unexpected application error', {
    correlationId,
    code: error.code || 'UNEXPECTED_ERROR'
  });
  return res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred.',
    details: null,
    timestamp: new Date().toISOString(),
    correlationId
  });
}

module.exports = errorHandler;
