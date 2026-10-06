const argon2 = require('argon2');

function hashPassword(password) {
  return argon2.hash(password, { type: argon2.argon2id });
}

module.exports = { hashPassword };
