const { assembleAuthentication } = require('./auth/authentication.composition');
function assemble(bindings) {
  return assembleAuthentication(bindings, {
    roles: ['PARTICIPANT'], participant: true,
    loginPath: '/auth/participants/login',
    successShape: ['userId', 'participantId', 'role', 'status', 'expiresAt']
  });
}
module.exports = { assemble };
