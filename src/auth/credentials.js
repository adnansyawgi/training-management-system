const argon2 = require('argon2');
const { randomBytes } = require('node:crypto');
// Preserve the Buffer return type across Node's generic declaration versions.
const secureBytes = /** @type {(size: number) => Buffer} */ (randomBytes);
const { hashPassword } = require('./password-hasher');
function makeCredentials() {
  /** @type {Promise<string> | undefined} */
  let dummyHash;
  function initialize() {
    // Random, unusable credential; same Argon2id cost as WF-001 account creation.
    if (!dummyHash) dummyHash = hashPassword(secureBytes(32).toString('hex'));
    return dummyHash;
  }
  return {
    initialize,
    async verifyAgainstDummyHash(password) { await argon2.verify(await initialize(), password); },
    async verifyArgon2id(hash, password) {
      if (typeof hash !== 'string' || !hash.startsWith('$argon2id$')) {
        throw new Error('Invalid stored Argon2id credential.');
      }
      return argon2.verify(hash, password);
    }
  };
}
module.exports = { makeCredentials };
