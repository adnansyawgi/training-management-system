const { randomUUID } = require('node:crypto');

function correlationIdMiddleware(req, res, next) {
  const supplied = req.get('x-correlation-id');
  const correlationId = typeof supplied === 'string' && supplied.trim().length <= 100 && supplied.trim()
    ? supplied.trim()
    : randomUUID();

  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
}

module.exports = correlationIdMiddleware;
