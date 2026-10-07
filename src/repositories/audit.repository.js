async function resolveTechnicalActor(connection) {
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
  return actors[0].user_id;
}

async function createParticipantSelfRegistrationAudit(connection, context) {
  const actorId = await resolveTechnicalActor(connection);

  await connection.execute(`
    INSERT INTO audit_records (
      event_timestamp, actor_user_id, actor_role, action, entity_type, entity_id, result,
      change_summary, previous_value, new_value, access_scope, data_classification,
      ip_address, user_agent, correlation_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    context.createdAt, actorId, 'SYSTEM_ADMINISTRATOR', 'ACCOUNT_CREATED',
    'PARTICIPANT_ACCOUNT', String(context.participantId), 'SUCCESS',
    'Participant account created through public self-registration.', null,
    JSON.stringify({ userId: context.userId, participantId: context.participantId }),
    'PARTICIPANT', 'PERSONAL_DATA', context.ipAddress || null, context.userAgent || null,
    context.correlationId || null
  ]);
}

async function createAuthenticationAudit(unit, user, context, outcome) {
  const success = outcome === 'SUCCESS';
  const administrator = context.authenticationRole === 'SYSTEM_ADMINISTRATOR';
  const staff = context.authenticationRole === 'STAFF';
  const label = administrator ? 'System Administrator' : staff
    ? success && user.role_id === 'TRAINING_ADMINISTRATOR' ? 'Training Administrator' : success ? 'Trainer' : 'Staff'
    : 'Participant';
  const scope = administrator ? 'ALL_ADMINISTRATIVE_USERS' : staff
    ? success ? user.role_id === 'TRAINING_ADMINISTRATOR' ? 'ALL_TRAINING_OPERATIONS' : 'ASSIGNED_PROGRAMS' : 'STAFF'
    : 'PARTICIPANT';
  const actorId = success ? user.user_id : await resolveTechnicalActor(unit.connection);
  await unit.connection.execute(`
    INSERT INTO audit_records (
      event_timestamp, actor_user_id, actor_role, action, entity_type, entity_id, result,
      change_summary, previous_value, new_value, access_scope, data_classification,
      ip_address, user_agent, correlation_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    unit.now, actorId, success ? user.role_id : 'SYSTEM_ADMINISTRATOR',
    success ? 'AUTHENTICATION_SUCCEEDED' : 'AUTHENTICATION_FAILED',
    'USER_AUTHENTICATION', user ? String(user.user_id) : 'ANONYMOUS',
    success ? 'SUCCESS' : 'FAILURE',
    success ? `${label} authentication succeeded.` : `${label} authentication was rejected.`,
    null, null, scope, 'PERSONAL_DATA', context.ipAddress || null,
    context.userAgent ? context.userAgent.slice(0, 500) : null, context.correlationId || null
  ]);
}

async function createSystemAdministratorBootstrapAudit(connection, event) {
  const actorId = await resolveTechnicalActor(connection);
  await connection.execute(`INSERT INTO audit_records (
    event_timestamp, actor_user_id, actor_role, action, entity_type, entity_id, result,
    change_summary, previous_value, new_value, access_scope, data_classification,
    ip_address, user_agent, correlation_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    event.occurredAt, actorId, 'SYSTEM_ADMINISTRATOR', 'ACCOUNT_CREATED', 'SYSTEM_ADMINISTRATOR_ACCOUNT',
    String(event.userId), 'SUCCESS', 'System Administrator created through static-key bootstrap.',
    null, JSON.stringify({ userId: String(event.userId) }), 'ALL_ADMINISTRATIVE_USERS', 'PERSONAL_DATA',
    event.context.ipAddress || null, event.context.userAgent?.slice(0, 500) || null,
    event.context.correlationId || null
  ]);
}

async function createSystemAdministratorBootstrapRejectionAudit(connection, context) {
  const actorId = await resolveTechnicalActor(connection);
  await connection.execute(`INSERT INTO audit_records (
    event_timestamp, actor_user_id, actor_role, action, entity_type, entity_id, result,
    change_summary, previous_value, new_value, access_scope, data_classification,
    ip_address, user_agent, correlation_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    new Date(), actorId, 'SYSTEM_ADMINISTRATOR', 'BOOTSTRAP_REJECTED', 'SYSTEM_ADMINISTRATOR_ACCOUNT',
    'ANONYMOUS', 'FAILURE', 'System Administrator bootstrap was rejected.', null, null,
    'ALL_ADMINISTRATIVE_USERS', 'PERSONAL_DATA', context.ipAddress || null,
    context.userAgent?.slice(0, 500) || null, context.correlationId || null
  ]);
}

module.exports = { createParticipantSelfRegistrationAudit, resolveTechnicalActor, createAuthenticationAudit,
  createSystemAdministratorBootstrapAudit, createSystemAdministratorBootstrapRejectionAudit };

async function createAdministrativeUserAudit(connection, event) {
  await connection.execute(`INSERT INTO audit_records (
    event_timestamp, actor_user_id, actor_role, action, entity_type, entity_id, result,
    change_summary, previous_value, new_value, access_scope, data_classification,
    ip_address, user_agent, correlation_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    event.occurredAt, event.actorUserId, 'SYSTEM_ADMINISTRATOR', 'ACCOUNT_CREATED', 'ADMINISTRATIVE_USER_ACCOUNT',
    String(event.userId), 'SUCCESS', 'Administrative user account created by System Administrator.',
    null, JSON.stringify({ userId: String(event.userId), role: event.role }), 'ALL_ADMINISTRATIVE_USERS', 'PERSONAL_DATA',
    event.context.ipAddress || null, event.context.userAgent?.slice(0, 500) || null, event.context.correlationId || null
  ]);
}

async function createCsrfRejectionAudit(connection, principal, context) {
  await connection.execute(`INSERT INTO audit_records (
    event_timestamp, actor_user_id, actor_role, action, entity_type, entity_id, result,
    change_summary, previous_value, new_value, access_scope, data_classification,
    ip_address, user_agent, correlation_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    new Date(), principal.userId, principal.role, 'CSRF_REJECTED', 'ADMINISTRATIVE_USER_ACCOUNT',
    'REQUEST', 'FAILURE', 'Authenticated request rejected by CSRF validation.', null, null,
    'ALL_ADMINISTRATIVE_USERS', 'PERSONAL_DATA', context.ipAddress || null,
    context.userAgent?.slice(0, 500) || null, context.correlationId || null
  ]);
}
module.exports.createAdministrativeUserAudit = createAdministrativeUserAudit;
module.exports.createCsrfRejectionAudit = createCsrfRejectionAudit;
