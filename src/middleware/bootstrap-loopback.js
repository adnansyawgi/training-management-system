const { errors } = require('../auth/authentication-errors');
function requireBootstrapLoopback(req, res, next) {
  // Use the TCP peer, never req.ip or client-controlled forwarding headers.
  const address = req.socket.remoteAddress;
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)) return next(errors.forbidden());
  return next();
}
module.exports = { requireBootstrapLoopback };
