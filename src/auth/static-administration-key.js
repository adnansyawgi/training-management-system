const { createHash, timingSafeEqual } = require('node:crypto');
const compareDigests = /** @type {(left: Buffer, right: Buffer) => boolean} */ (timingSafeEqual);
function makeStaticAdministrationKey({ errors, configuredKey = () => process.env.STATIC_ADMINISTRATION_KEY }) {
  return { async verify(supplied) {
    const configured = configuredKey();
    if (typeof configured !== 'string' || !configured) {
      throw Object.assign(new Error('Static administration key is not configured.'), { code: 'BOOTSTRAP_CONFIGURATION_ERROR' });
    }
    const digest = /** @type {(value: string) => Buffer} */ (value => createHash('sha256').update(value).digest());
    const valid = typeof supplied === 'string' && supplied.length > 0 &&
      compareDigests(digest(configured), digest(supplied));
    if (!valid) throw errors.authentication();
  } };
}
module.exports = { makeStaticAdministrationKey };
