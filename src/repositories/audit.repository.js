async function createParticipantSelfRegistrationAudit(connection, context) {
  // The initial migration generates this identity. Deployment must bind the
  // provisioned actor explicitly; other disabled administrators are not actors.
  const actorIdentifier = process.env.SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER;
  if (!actorIdentifier || !actorIdentifier.trim()) {
    const error = new Error('Reserved technical audit actor identity is not configured.');
    error.code = 'AUDIT_ACTOR_CONFIGURATION_ERROR';
    throw error;
  }
  const [actors] = await connection.execute(`
    SELECT user_id FROM users
    WHERE account_identifier = ?
      AND role_id = 'SYSTEM_ADMINISTRATOR'
      AND account_status = 'DISABLED'
      AND authentication_method = 'SYSTEM'
    LIMIT 2`, [actorIdentifier.trim()]);
  if (actors.length !== 1) {
    const error = new Error('Exactly one reserved technical audit actor is required.');
    error.code = 'AUDIT_ACTOR_CONFIGURATION_ERROR';
    throw error;
  }

  await connection.execute(`
    INSERT INTO audit_records (
      event_timestamp, actor_user_id, actor_role, action, entity_type, entity_id, result,
      change_summary, previous_value, new_value, access_scope, data_classification,
      ip_address, user_agent, correlation_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    context.createdAt, actors[0].user_id, 'SYSTEM_ADMINISTRATOR', 'ACCOUNT_CREATED',
    'PARTICIPANT_ACCOUNT', String(context.participantId), 'SUCCESS',
    'Participant account created through public self-registration.', null,
    JSON.stringify({ userId: context.userId, participantId: context.participantId }),
    'PARTICIPANT', 'PERSONAL_DATA', context.ipAddress || null, context.userAgent || null,
    context.correlationId || null
  ]);
}

module.exports = { createParticipantSelfRegistrationAudit };
