const express = require('express');
const { errors } = require('../auth/authentication-errors');
const { makeValidators } = require('../validators/registration-management-view.validator');
const { makeFeatureDto } = require('../repositories/registration-management-view.dto');
const { makeService } = require('../services/registration-management-view.service');
const { makeController } = require('../controllers/system-administrator-bootstrap.controller');
const { makeResponseCodec } = require('../utils/implementation-response-codec');
const { makeResponseTransport } = require('../utils/implementation-response-transport');
function assemble(bindings) {
  const codec = makeResponseCodec();
  const service = makeService({ ...bindings, errors, dto: makeFeatureDto(codec) });
  const validators = makeValidators({ errors, ...bindings.configuration });
  const controller = makeController({ service, requestContext: bindings.requestContext, response: makeResponseTransport(codec, {
    list: ['items','page','pageSize','total'],
    detail: ['registrationId','referenceNo','participantId','programId','registeredAt','status','cancelledAt','cancellationReason','registrationRemarks']
  }) });
  const router = express.Router();
  router.get('/admin/registrations', bindings.security.requireSession, bindings.security.requireRole('TRAINING_ADMINISTRATOR'), validators.list, controller.endpoint('list',200));
  router.get('/admin/registrations/:registrationId', bindings.security.requireSession, bindings.security.requireRole('TRAINING_ADMINISTRATOR'), validators.detail, controller.endpoint('detail',200));
  return router;
}
module.exports = { assemble };
