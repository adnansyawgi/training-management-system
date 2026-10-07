const argon2 = require('argon2');
// The encoded overload always returns a string when raw is false.
const hashEncoded = /** @type {(password: string | Buffer, options: {type: number, raw: false}) => Promise<string>} */ (argon2.hash);

function hashPassword(password) {
  return hashEncoded(password, { type: argon2.argon2id, raw: false });
}

module.exports = { hashPassword };
