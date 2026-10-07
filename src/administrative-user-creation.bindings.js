const pool = require('./config/database');
const { errors } = require('./auth/authentication-errors');
const { sessions } = require('./participant-authentication.bindings');
const { makeSessionSecurity } = require('./middleware/session-security');
const { makeBootstrapRepository } = require('./repositories/system-administrator-bootstrap.repository');
const { makeAdministrativeUserRepository } = require('./repositories/administrative-user-creation.repository');
const { resolveStaffRoleDefaults } = require('./auth/staff-role-defaults');
const { hashPassword } = require('./auth/password-hasher');
const audit = require('./repositories/audit.repository');
const repository = makeAdministrativeUserRepository({ pool, errors });
const security = makeSessionSecurity({ sessions, errors,
  audit: { csrfRejected: (principal, context) => audit.createCsrfRejectionAudit(pool, principal, context) } });
module.exports = {
  security, repositoriesAndServices: { transactions: repository, authorization: repository,
    accounts: makeBootstrapRepository({ pool, errors }), roles: { resolve: resolveStaffRoleDefaults },
    passwords: { hashPassword }, clock: { now: () => new Date() }, audit: { accountCreated: audit.createAdministrativeUserAudit } },
  requestContext: req => ({ principal: req.principal, sessionId: req.authenticatedSessionId,
    correlationId: req.correlationId, ipAddress: req.ip, userAgent: req.get('user-agent') })
};
