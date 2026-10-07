const { assembleAuthentication } = require('../auth/authentication.composition');
function assemble(bindings) {
  const requestContext = req => ({ ...bindings.requestContext(req), authenticationRole: 'STAFF' });
  return assembleAuthentication({ ...bindings, requestContext }, {
    roles: ['TRAINING_ADMINISTRATOR', 'TRAINER'], participant: false,
    loginPath: '/auth/staff/login',
    successShape: ['userId', 'role', 'status', 'expiresAt']
  });
}
module.exports = { assemble };
