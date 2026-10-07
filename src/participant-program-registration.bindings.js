const pool = require('./config/database');
const { errors } = require('./auth/authentication-errors');
const { sessions } = require('./participant-authentication.bindings');
const audit = require('./repositories/audit.repository');
const { makeSessionSecurity } = require('./middleware/session-security');
const { makeRegistrationRepository } = require('./repositories/participant-program-registration.repository');
const { makeNotificationRepository } = require('./repositories/registration-notification.repository');
const repository = makeRegistrationRepository({ pool, errors });
module.exports = { repository, transactions: repository,
  security: makeSessionSecurity({ sessions, errors, audit: { csrfRejected: (principal, context) => audit.createCsrfRejectionAudit(pool, principal, context) } }),
  audit: { registrationCreated: audit.createRegistrationAudit }, outbox: makeNotificationRepository({ pool }), clock: { now: () => new Date() },
  requestContext: req => ({ principal: req.principal, sessionId: req.authenticatedSessionId, correlationId: req.correlationId,
    ipAddress: req.ip, userAgent: req.get('user-agent') }) };
