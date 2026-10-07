const express = require('express');
const { makeValidators } = require('../validators/program-details.validator');
const { makeService } = require('../services/program-details.service');
const { makeFeatureDto, fields } = require('../repositories/program-details.dto');
const { makeController } = require('../controllers/system-administrator-bootstrap.controller');
const { makeResponseCodec } = require('../utils/implementation-response-codec');
const { makeResponseTransport } = require('../utils/implementation-response-transport');
const { errors } = require('../auth/authentication-errors');
function assemble({ programs }) {
  if (typeof programs?.findPublicDetail !== 'function') throw new Error('Program detail repository required.');
  const codec = makeResponseCodec();
  const validators = makeValidators({ errors });
  const service = makeService({ programs, dto: makeFeatureDto(codec), errors });
  const controller = makeController({ service, requestContext: () => ({}),
    response: makeResponseTransport(codec, { detail: fields.map(field => field[0]) }) });
  const router = express.Router();
  router.get('/programs/:programId', validators.detail, controller.endpoint('detail', 200));
  return router;
}
module.exports = { assemble };
