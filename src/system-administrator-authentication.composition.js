const { assembleAuthentication } = require('./auth/authentication.composition');
function assemble(bindings) {
  const requestContext = req => ({ ...bindings.requestContext(req), authenticationRole: 'SYSTEM_ADMINISTRATOR' });
  return assembleAuthentication({ ...bindings, requestContext }, {
    roles: ['SYSTEM_ADMINISTRATOR'], participant: false,
    loginPath: '/auth/system-admin/login',
    successShape: ['userId', 'role', 'status', 'expiresAt']
  });
}
module.exports = { assemble };
