const pool = require('./config/database');
const repository = require('./repositories/authentication.repository');
const audit = require('./repositories/audit.repository');
const { makeCredentials } = require('./auth/credentials');
const { makeDatabaseSessions } = require('./auth/database-sessions');
const { makeAuthenticationSecurity } = require('./auth/authentication-security');
const { errors, errorCodes } = require('./auth/authentication-errors');
const sessions = makeDatabaseSessions({ pool });
const credentials = makeCredentials();
const security = makeAuthenticationSecurity({ pool, repository, audit, sessions, errors });

const bindings = {
  errorCodes, identityPolicy: {}, validation: {}, cookies: sessions,
  requestContext: req => ({ correlationId: req.correlationId, ipAddress: req.ip,
    userAgent: req.get('user-agent'), previousSessionId: sessions.readId(req) }),
  repositoriesAndServices: {
    users: repository, participants: repository, security, credentials, sessions
  }
};
module.exports = { bindings, sessions, credentials };
