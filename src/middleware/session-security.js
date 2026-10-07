const { timingSafeEqual } = require('node:crypto');
function makeSessionSecurity({ sessions, errors, audit }) {
  return {
    async requireSession(req, res, next) {
      try {
        const principal = await sessions.load(req);
        if (!principal) return next(errors.authentication());
        req.principal = principal;
        req.authenticatedSessionId = sessions.readId(req);
        res.locals.csrfToken = principal.csrfToken;
        res.setHeader('Cache-Control', 'no-store');
        return next();
      } catch (error) { return next(error); }
    },
    requireRole(role) {
      return (req, res, next) => req.principal?.role === role ? next() : next(errors.forbidden());
    },
    async requireCsrf(req, res, next) {
      try {
        const supplied = req.get('X-CSRF-Token');
        const expected = req.principal?.csrfToken;
        const valid = typeof supplied === 'string' && /^[a-f0-9]{64}$/.test(supplied) &&
          typeof expected === 'string' && expected.length === 64 &&
          timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
        if (!valid) {
          await audit.csrfRejected(req.principal, { correlationId: req.correlationId, ipAddress: req.ip, userAgent: req.get('user-agent') });
          return next(errors.forbidden());
        }
        return next();
      } catch (error) { return next(error); }
    }
  };
}
module.exports = { makeSessionSecurity };
