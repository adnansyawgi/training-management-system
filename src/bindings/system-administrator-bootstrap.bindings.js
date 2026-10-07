const pool = require('../config/database');
const { errors } = require('../auth/authentication-errors');
const { makeApprovedBootstrapEmail } = require('../auth/bootstrap-approved-email');
const { makeBootstrapRepository } = require('../repositories/system-administrator-bootstrap.repository');
const { resolveSystemAdministratorRoleDefaults } = require('../auth/system-administrator-role-defaults');
const { hashPassword } = require('../auth/password-hasher');
const { createSystemAdministratorBootstrapAudit, createSystemAdministratorBootstrapRejectionAudit } = require('../repositories/audit.repository');
const repository = makeBootstrapRepository({ pool, errors });
module.exports = {
  repositoriesAndServices: {
    approvedEmail: makeApprovedBootstrapEmail({ errors }), passwords: { hashPassword },
    bootstrap: repository, users: repository, accounts: repository,
    roles: { resolve: resolveSystemAdministratorRoleDefaults }, clock: { now: () => new Date() },
    audit: { bootstrap: createSystemAdministratorBootstrapAudit,
      bootstrapRejected: context => createSystemAdministratorBootstrapRejectionAudit(pool, context) }
  },
  requestContext: req => ({ correlationId: req.correlationId, ipAddress: req.ip, userAgent: req.get('user-agent') })
};
