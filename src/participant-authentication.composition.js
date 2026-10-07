const { makeValidators } = require('./validators/participant-authentication.validator');
const { makeController } = require('./controllers/participant-authentication.controller');
const { makeRouter } = require('./routes/participant-authentication.routes');
const { makeFeatureDto } = require('./repositories/participant-authentication.dto');
const ids = require('./validators/implementation-validation');
const { makeErrors } = require('./middleware/implementation-errors');
const { makeResponseCodec } = require('./utils/implementation-response-codec');
const { makeResponseTransport } = require('./utils/implementation-response-transport');
const { makeAuthenticationService } = require('./auth/shared-authentication.service');
const successShapes = { login: ['userId', 'participantId', 'role', 'status', 'expiresAt'] };
const requiredAdapters = [
  'credentials.verifyAgainstDummyHash', 'credentials.verifyArgon2id',
  'participants.findUniqueByUser', 'security.coordinateAttempt',
  'security.evaluateEligibility', 'security.recordFailure',
  'security.recordRoleRejection', 'security.recordSuccess',
  'security.recordUnknownAttempt', 'sessions.prepare', 'users.findForAuthentication'
];
// Feature composition. The host app supplies approved shared adapters once.
function assemble(bindings) {
  if (typeof bindings?.requestContext !== 'function' ||
      typeof bindings.cookies?.emitCommitted !== 'function' ||
      typeof bindings.cookies?.discardUnsent !== 'function') {
    throw new Error('Authentication context and committed cookie adapters are required.');
  }
  const errors = makeErrors(bindings.errorCodes);
  const codec = makeResponseCodec(bindings.identityPolicy);
  const dto = makeFeatureDto(codec, bindings.adminProgramProjection);
  const dependencies = { ...bindings.repositoriesAndServices, errors, ids, dto };
  for (const name of requiredAdapters) {
    const [group, method] = name.split('.');
    if (typeof dependencies[group]?.[method] !== 'function') {
      throw new Error('Missing approved adapter: ' + name);
    }
  }
  const sharedLogin = makeAuthenticationService(dependencies);
  const service = { login: (input, context) => sharedLogin(input, context, {
    roles: ['PARTICIPANT'], participant: true
  }) };
  const validators = makeValidators({ errors, cfg: bindings.validation,
    businessTime: bindings.businessTime });
  const controller = makeController({ service, requestContext: bindings.requestContext,
    response: makeResponseTransport(codec, successShapes), cookies: bindings.cookies });
  return makeRouter({ controller, validators, security: bindings.securityMiddleware });
}
module.exports = { assemble };
