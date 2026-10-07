// src/auth/shared-authentication.service.js
function makeAuthenticationService(d) {
  return async function login(input, context, policy) {
    const outcome = await d.security.coordinateAttempt(input.email, async unit => {
      const user = await d.users.findForAuthentication(unit, input.email);
      if (!user) {
        await d.credentials.verifyAgainstDummyHash(input.password);
        await d.security.recordUnknownAttempt(unit, context);
        return { failure: d.errors.authentication() };
      }
      const blocked = await d.security.evaluateEligibility(unit, user, context);
      if (blocked) return { failure: blocked };
      if (!await d.credentials.verifyArgon2id(user.password_hash, input.password)) {
        await d.security.recordFailure(unit, user, context);
        return { failure: d.errors.authentication() };
      }
      if (!policy.roles.includes(user.role_id) || user.role_name !== user.role_id) {
        await d.security.recordRoleRejection(unit, user, context);
        return { failure: d.errors.authentication() };
      }
      let participant = null;
      if (policy.participant) {
        participant = await d.participants.findUniqueByUser(unit, user.user_id);
        if (!participant) throw d.errors.integrity();
      }
      // No res mutation and no Set-Cookie header here.
      const prepared = await d.sessions.prepare(unit, context, {
        userId: d.ids.positiveId(user.user_id), role: user.role_id,
        participantId: participant ? d.ids.positiveId(participant.participant_id) : undefined
      });
      await d.security.recordSuccess(unit, user, context);
      const payload = { userId: user.user_id, role: user.role_id, status: 'ACTIVE',
        expiresAt: prepared.expiresAt };
      if (participant) payload.participantId = participant.participant_id;
      return { payload, cookiePlan: prepared.cookiePlan };
    });
    // Coordinator resolves only after required persistence succeeds.
    // Rejected attempts preserve counters; failed success paths clean prepared sessions.
    if (outcome.failure) throw outcome.failure;
    return outcome; // Internal envelope; controller returns payload only.
  };
}
module.exports = { makeAuthenticationService };
