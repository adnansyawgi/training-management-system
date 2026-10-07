const { email } = require('../validators/implementation-validation');
function makeApprovedBootstrapEmail({ errors, configuredEmail = () => process.env.SYSTEM_ADMIN_BOOTSTRAP_APPROVED_EMAIL }) {
  return { verify(submitted) {
    let approved;
    try { approved = email(configuredEmail()); }
    catch { throw new Error('Bootstrap configuration is unavailable.'); }
    if (email(submitted) !== approved) throw errors.authentication();
  } };
}
module.exports = { makeApprovedBootstrapEmail };
