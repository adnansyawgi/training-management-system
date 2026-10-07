const express = require('express');
const { errors } = require('../auth/authentication-errors');
const { makeValidators } = require('../validators/participant-registration-cancellation.validator');
const { makeService } = require('../services/participant-registration-cancellation.service');
const { makeFeatureDto } = require('../repositories/participant-registration-cancellation.dto');
const { makeController } = require('../controllers/system-administrator-bootstrap.controller');
const { makeResponseCodec } = require('../utils/implementation-response-codec');
const { makeResponseTransport } = require('../utils/implementation-response-transport');
function assemble(bindings) {
  const codec = makeResponseCodec();
  const service = makeService({ ...bindings, errors, codec, dto: makeFeatureDto(codec) });
  const validators = makeValidators({ errors, ...bindings.configuration });
  const controller = makeController({ service, requestContext: bindings.requestContext, response: makeResponseTransport(codec,
    { list: ['items','page','pageSize','total'], cancel: ['registrationId','referenceNo','status','cancelledAt'] }) });
  const router = express.Router();
  router.get('/registrations', bindings.security.requireSession, bindings.security.requireRole('PARTICIPANT'), validators.list, controller.endpoint('list', 200));
  router.post('/registrations/:registrationId/cancel', bindings.security.requireSession, bindings.security.requireRole('PARTICIPANT'),
    bindings.security.requireCsrf, validators.cancel, controller.endpoint('cancel', 200));
  return router;
}
module.exports = { assemble };
