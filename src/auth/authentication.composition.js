const { makeValidators } = require('../validators/participant-authentication.validator');
const { makeController } = require('../controllers/participant-authentication.controller');
const { makeRouter } = require('../routes/participant-authentication.routes');
const ids = require('../validators/implementation-validation');
const { makeErrors } = require('../middleware/implementation-errors');
const { makeResponseCodec } = require('../utils/implementation-response-codec');
const { makeResponseTransport } = require('../utils/implementation-response-transport');
const { makeAuthenticationService } = require('./shared-authentication.service');

function assembleAuthentication(bindings, policy) {
  if (typeof bindings?.requestContext !== 'function' ||
      typeof bindings.cookies?.emitCommitted !== 'function' ||
      typeof bindings.cookies?.discardUnsent !== 'function') {
    throw new TypeError('Authentication context and committed cookie adapters are required.');
  }
  const errors = makeErrors(bindings.errorCodes);
  const codec = makeResponseCodec(bindings.identityPolicy);
  const dependencies = { ...bindings.repositoriesAndServices, errors, ids };
  const required = [
    'credentials.verifyAgainstDummyHash', 'credentials.verifyArgon2id',
    'security.coordinateAttempt', 'security.evaluateEligibility', 'security.recordFailure',
    'security.recordRoleRejection', 'security.recordSuccess', 'security.recordUnknownAttempt',
    'sessions.prepare', 'users.findForAuthentication'
  ];
  if (policy.participant) { required.push('participants.findUniqueByUser'); }
  for (const name of required) {
    const [group, method] = name.split('.');
    if (typeof dependencies[group]?.[method] !== 'function') { throw new TypeError('Missing approved adapter: ' + name); }
  }
  const sharedLogin = makeAuthenticationService(dependencies);
  const service = { login: (input, context) => sharedLogin(input, context, policy) };
  const validators = makeValidators({ errors });
  const controller = makeController({ service, requestContext: bindings.requestContext,
    response: makeResponseTransport(codec, { login: policy.successShape }), cookies: bindings.cookies });
  return makeRouter({ controller, validators, loginPath: policy.loginPath });
}
module.exports = { assembleAuthentication };
