const { positiveId, sameId } = require('../validators/implementation-validation');
const { editableFields, parseProfileUpdate } = require('../validators/profile.validator');
const { makeResponseCodec } = require('../utils/implementation-response-codec');
function maskIdentity(value) {
  const chars = Array.from(value);
  return '*'.repeat(Math.max(4, chars.length - 4)) + (chars.length > 4 ? chars.slice(-4).join('') : '');
}
function makeProfileService({ pool, users, participants, audit, errors, clock = () => new Date() }) {
  const codec = makeResponseCodec();
  async function read(connection, principal, lock = false) {
    const id = positiveId(principal.userId);
    // Existing registration transactions lock participant before user.
    const profiles = await participants.findParticipantByUserId(connection, id, lock);
    const user = await users.findUserById(connection, id, lock);
    if (!user || user.role_id !== principal.role || user.role_name !== user.role_id || user.account_status !== 'ACTIVE' || user.authentication_method === 'SYSTEM') throw errors.authentication();
    if (principal.role === 'PARTICIPANT') {
      if (profiles.length !== 1 || !sameId(profiles[0].participant_id, principal.participantId)) throw errors.integrity();
    } else if (profiles.length) throw errors.integrity();
    return { user, participant: profiles[0] };
  }
  function dto({ user, participant }) {
    const profile = { name: user.name, email: user.email, accountStatus: user.account_status };
    if (user.role_id === 'PARTICIPANT') {
      profile.participantId = codec.id(participant.participant_id);
      profile.nricPassportNo = maskIdentity(participant.nric_passport_no);
      profile.name = participant.name;
      profile.mobileNo = participant.mobile_no;
    } else profile.username = user.username;
    return { userId: codec.id(user.user_id), accountIdentifier: user.account_identifier, role: user.role_id,
      profile, editableFields: editableFields(user.role_id) };
  }
  return {
    async getOwnProfile(principal) { return dto(await read(pool, principal)); },
    async updateOwnProfile(principal, body, context) {
      const fields = parseProfileUpdate(body, principal.role, errors);
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const before = await read(connection, principal, true);
        const now = clock();
        await users.updateUserProfileFields(connection, principal.userId, fields, now);
        await participants.updateParticipantProfileFields(connection, principal.userId, fields, now);
        const after = await read(connection, principal);
        const output = dto(after);
        await audit.profileUpdated(connection, { principal, context, before, after, now });
        await connection.commit();
        return output;
      } catch (error) {
        try { await connection.rollback(); } catch { /* Preserve the original write failure. */ }
        if (error.wf001ConflictType === 'PARTICIPANT_EMAIL_OR_NRIC') throw errors.conflict();
        throw error;
      } finally { connection.release(); }
    }
  };
}
module.exports = { makeProfileService };
