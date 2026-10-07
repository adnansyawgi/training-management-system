const { timingSafeEqual } = require('node:crypto');
function makeSessionSecurity({ sessions, errors, audit }) {
  return {
    async optionalSession(req, res, next) {
      try {
        const principal = await sessions.load(req);
        if (principal) {
          req.principal = principal;
          res.locals.principal = principal;
          res.locals.csrfToken = principal.csrfToken;
          res.setHeader('Cache-Control', 'no-store');
        }
        next();
      } catch (error) { next(error); }
    },
    async requireSession(req, res, next) {
      try {
        const principal = await sessions.load(req);
        if (!principal) {
          if (req.path === '/api/v1/auth/logout') sessions.clearCookie(res);
          return next(errors.authentication());
        }
        req.principal = principal;
        req.authenticatedSessionId = sessions.readId(req);
        res.locals.csrfToken = principal.csrfToken;
        res.locals.principal = principal;
        res.setHeader('Cache-Control', 'no-store');
        return next();
      } catch (error) { return next(error); }
    },
    requireRole(role) {
      const allowed = Array.isArray(role) ? role : [role];
      return (req, res, next) => allowed.includes(req.principal?.role) ? next() : next(errors.forbidden());
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
