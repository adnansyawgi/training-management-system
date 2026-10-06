const { ulid } = require('ulid');

function generateParticipantIdentifiers() {
  return { accountIdentifier: `P-${ulid()}`, username: `participant-${ulid()}` };
}

module.exports = { generateParticipantIdentifiers };
