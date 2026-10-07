const express = require('express');
const { errors } = require('./auth/authentication-errors');
const { makeService } = require('./services/participant-program-registration.service');
const { makeValidators } = require('./validators/participant-program-registration.validator');
const { makeController } = require('./controllers/system-administrator-bootstrap.controller');
const { makeResponseCodec } = require('./utils/implementation-response-codec');
const { makeResponseTransport } = require('./utils/implementation-response-transport');
function assemble(bindings) {
  const codec = makeResponseCodec();
  const service = makeService({ ...bindings, errors, codec });
  const validators = makeValidators({ errors });
  const controller = makeController({ service, requestContext: bindings.requestContext,
    response: makeResponseTransport(codec, { register: ['registrationId','referenceNo','programId','status','registeredAt'] }) });
  const router = express.Router();
  router.post('/registrations', bindings.security.requireSession, bindings.security.requireRole('PARTICIPANT'),
    bindings.security.requireCsrf, validators.register, controller.endpoint('register', 201));
  return router;
}
module.exports = { assemble };
