const express = require('express');
const { makeValidators } = require('./validators/program-catalogue.validator');
const { makeService } = require('./services/program-catalogue.service');
const { makeFeatureDto } = require('./repositories/program-catalogue.dto');
const { makeController } = require('./controllers/system-administrator-bootstrap.controller');
const { makeResponseCodec } = require('./utils/implementation-response-codec');
const { makeResponseTransport } = require('./utils/implementation-response-transport');
const { errors } = require('./auth/authentication-errors');
function assemble({ catalogue, configuration }) {
  if (typeof catalogue?.readPage !== 'function') throw new Error('Catalogue repository required.');
  const codec = makeResponseCodec();
  const service = makeService({ catalogue, dto: makeFeatureDto(codec) });
  const validators = makeValidators({ errors, configuration });
  const controller = makeController({ service, requestContext: () => ({}),
    response: makeResponseTransport(codec, { list: ['items', 'page', 'pageSize', 'total'] }) });
  const router = express.Router();
  router.get('/programs', validators.list, controller.endpoint('list', 200));
  return router;
}
module.exports = { assemble };
