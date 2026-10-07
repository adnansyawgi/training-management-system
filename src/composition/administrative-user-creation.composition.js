const { makeService } = require('../services/administrative-user-creation.service');
const { makeValidators } = require('../validators/administrative-user-creation.validator');
const { makeController } = require('../controllers/system-administrator-bootstrap.controller');
const { makeResponseCodec } = require('../utils/implementation-response-codec');
const { makeResponseTransport } = require('../utils/implementation-response-transport');
const { errors } = require('../auth/authentication-errors');
const express = require('express');
function assemble(bindings) {
  for (const name of ['transactions.run', 'authorization.assertCreator', 'accounts.createWithIdentifierRetry',
    'roles.resolve', 'passwords.hashPassword', 'clock.now', 'audit.accountCreated']) {
    const [group, method] = name.split('.');
    if (typeof bindings.repositoriesAndServices?.[group]?.[method] !== 'function') throw new Error('Missing administrative user adapter: ' + name);
  }
  if (typeof bindings.security?.requireSession !== 'function' || typeof bindings.security?.requireRole !== 'function' ||
      typeof bindings.security?.requireCsrf !== 'function' || typeof bindings.requestContext !== 'function') throw new Error('Administrative user security bindings are required.');
  const responseCodec = makeResponseCodec();
  const service = makeService({ ...bindings.repositoriesAndServices, errors, responseCodec });
  const validators = makeValidators({ errors });
  const controller = makeController({ service, requestContext: bindings.requestContext,
    response: makeResponseTransport(responseCodec, { create: ['userId', 'accountIdentifier', 'username', 'name', 'email', 'role', 'accountStatus', 'createdAt'] }) });
  const router = express.Router();
  router.post('/admin/users', bindings.security.requireSession, bindings.security.requireRole('SYSTEM_ADMINISTRATOR'),
    bindings.security.requireCsrf, validators.create, controller.endpoint('create', 201));
  return router;
}
module.exports = { assemble };
