const { makeService } = require('../services/system-administrator-bootstrap.service');
const { makeValidators } = require('../validators/system-administrator-bootstrap.validator');
const { makeController } = require('../controllers/system-administrator-bootstrap.controller');
const { makeRouter } = require('../routes/system-administrator-bootstrap.routes');
const { makeResponseCodec } = require('../utils/implementation-response-codec');
const { makeResponseTransport } = require('../utils/implementation-response-transport');
const { errors } = require('../auth/authentication-errors');
function assemble({ repositoriesAndServices, requestContext }) {
  for (const name of ['keys.verify', 'passwords.hashPassword', 'bootstrap.withExclusiveEligibility',
    'users.hasActiveSystemAdministrator', 'roles.resolve', 'clock.now', 'accounts.createWithIdentifierRetry', 'audit.bootstrap']) {
    const [group, method] = name.split('.');
    if (typeof repositoriesAndServices?.[group]?.[method] !== 'function') throw new Error('Missing bootstrap adapter: ' + name);
  }
  if (typeof requestContext !== 'function') throw new Error('Bootstrap request context is required.');
  const codec = makeResponseCodec();
  const service = makeService({ ...repositoriesAndServices, errors, responseCodec: codec });
  const validators = makeValidators({ errors });
  const response = makeResponseTransport(codec, {
    bootstrap: ['userId', 'accountIdentifier', 'username', 'role', 'accountStatus', 'createdAt']
  });
  return makeRouter({ validators, controller: makeController({ service, requestContext, response }) });
}
module.exports = { assemble };
