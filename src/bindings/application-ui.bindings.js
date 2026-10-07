const pool = require('../config/database');
const { errors } = require('../auth/authentication-errors');
const { sessions } = require('./participant-authentication.bindings');
const users = require('../repositories/user.repository');
const participants = require('../repositories/participant.repository');
const audit = require('../repositories/audit.repository');
const { makeSessionSecurity } = require('../middleware/session-security');
const { makeProfileService } = require('../services/profile.service');
const security = makeSessionSecurity({ sessions, errors, audit: {
  csrfRejected: (principal, context) => audit.createCsrfRejectionAudit(pool, principal, context)
} });
module.exports = { security, sessions,
  service: makeProfileService({ pool, users, participants, errors, audit: { profileUpdated: audit.createProfileUpdatedAudit } }),
  requestContext: req => ({ correlationId: req.correlationId, ipAddress: req.ip, userAgent: req.get('user-agent') })
};
