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

async function createCsrfRejectionAudit(connection, principal, context, target = {}) {
  await connection.execute(`INSERT INTO audit_records (
    event_timestamp, actor_user_id, actor_role, action, entity_type, entity_id, result,
    change_summary, previous_value, new_value, access_scope, data_classification,
    ip_address, user_agent, correlation_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    new Date(), principal.userId, principal.role, 'CSRF_REJECTED', target.entityType || (principal.role === 'PARTICIPANT' ? 'REGISTRATION' : 'ADMINISTRATIVE_USER_ACCOUNT'),
    'REQUEST', 'FAILURE', 'Authenticated request rejected by CSRF validation.', null, null,
    target.accessScope || (principal.role === 'PARTICIPANT' ? 'PARTICIPANT' : 'ALL_ADMINISTRATIVE_USERS'), 'PERSONAL_DATA', context.ipAddress || null,
    context.userAgent?.slice(0, 500) || null, context.correlationId || null
  ]);
}
module.exports.createAdministrativeUserAudit = createAdministrativeUserAudit;
module.exports.createCsrfRejectionAudit = createCsrfRejectionAudit;
module.exports.createRegistrationAudit = async (connection, event) => {
  await connection.execute(`INSERT INTO audit_records (event_timestamp,actor_user_id,actor_role,action,entity_type,entity_id,result,
    change_summary,previous_value,new_value,access_scope,data_classification,ip_address,user_agent,correlation_id)
    VALUES (?,?,'PARTICIPANT','REGISTRATION_CREATED','REGISTRATION',?,'SUCCESS','Participant registration created.',NULL,?,'PARTICIPANT','PERSONAL_DATA',?,?,?)`,
  [event.now, event.context.principal.userId, event.registrationId,
    JSON.stringify({ programId: event.programId, status: 'REGISTERED' }), event.context.ipAddress || null,
    event.context.userAgent?.slice(0, 500) || null, event.context.correlationId || null]);
};
module.exports.createRegistrationCancelledAudit = async (connection, event) => {
  await connection.execute(`INSERT INTO audit_records (event_timestamp,actor_user_id,actor_role,action,entity_type,entity_id,result,
    change_summary,previous_value,new_value,access_scope,data_classification,ip_address,user_agent,correlation_id)
    VALUES (?,?,'PARTICIPANT','REGISTRATION_CANCELLED','REGISTRATION',?,'SUCCESS','Participant registration cancelled.',?,?,'PARTICIPANT','PERSONAL_DATA',?,?,?)`,
  [event.now,event.context.principal.userId,event.row.registration_id,JSON.stringify({status:'REGISTERED'}),JSON.stringify({status:'CANCELLED'}),
    event.context.ipAddress || null,event.context.userAgent?.slice(0,500) || null,event.context.correlationId || null]);
};
module.exports.createManagementAudit = async (connection, event) => {
  const program=event.type==='PROGRAM';
  const programFields=['code','name','description','objectives','target_audience','prerequisites','category_id','trainer_user_id','training_date','start_time','end_time','venue','delivery_mode','capacity','registration_open_at','registration_close_at','status','cancellation_policy_reference','certificate_eligibility_criteria','certificate_type'];
  const values=row=>program ? Object.fromEntries(programFields.map(key=>[key,row[key]]))
    : {name:row.name,description:row.description,status:row.status};
  await connection.execute(`INSERT INTO audit_records (event_timestamp,actor_user_id,actor_role,action,entity_type,entity_id,result,
    change_summary,previous_value,new_value,access_scope,data_classification,ip_address,user_agent,correlation_id)
    VALUES (?,?,'TRAINING_ADMINISTRATOR',?,?,?,'SUCCESS',?,?,?,'ALL_TRAINING_OPERATIONS','PERSONAL_DATA',?,?,?)`,
  [event.now,event.context.principal.userId,event.type+'_'+(event.before?'UPDATED':'CREATED'),program?'TRAINING_PROGRAM':'PROGRAM_CATEGORY',
    String(program?event.saved.program_id:event.saved.category_id),program?'Training program saved.':'Program category saved.',
    event.before?JSON.stringify(values(event.before)):null,JSON.stringify(values(event.saved)),event.context.ipAddress || null,event.context.userAgent?.slice(0,500) || null,event.context.correlationId || null]);
};
module.exports.createAttendanceAudit = async (connection,event) => {
  const values=row=>({status:row.status,percentage:Number(row.percentage),attendanceDate:row.attendance_date,
    checkInAt:row.check_in_at,checkOutAt:row.check_out_at,verificationMethod:row.verification_method,
    evidenceReference:row.evidence_reference,recordedBy:String(row.recorded_by)});
  await connection.execute(`INSERT INTO audit_records (event_timestamp,actor_user_id,actor_role,action,entity_type,entity_id,result,
    change_summary,previous_value,new_value,access_scope,data_classification,ip_address,user_agent,correlation_id)
    VALUES (?,?,'TRAINER',?,'ATTENDANCE',?,'SUCCESS','Attendance saved.',?,?,'ASSIGNED_PROGRAMS','PERSONAL_DATA',?,?,?)`,
  [event.now,event.context.principal.userId,event.before?'ATTENDANCE_UPDATED':'ATTENDANCE_CREATED',String(event.row.attendance_id),
    event.before?JSON.stringify(values(event.before)):null,JSON.stringify(values(event.row)),event.context.ipAddress||null,
    event.context.userAgent?.slice(0,500)||null,event.context.correlationId||null]);
};
module.exports.createCertificateIssuedAudit = async(connection,event)=>{
  const row=event.row;
  await connection.execute(`INSERT INTO audit_records (event_timestamp,actor_user_id,actor_role,action,entity_type,entity_id,result,
    change_summary,previous_value,new_value,access_scope,data_classification,ip_address,user_agent,correlation_id)
    VALUES (?,?,'TRAINING_ADMINISTRATOR','CERTIFICATE_ISSUED','CERTIFICATE',?,'SUCCESS','Certificate issuance recorded.',NULL,?,'ALL_TRAINING_OPERATIONS','PERSONAL_DATA',?,?,?)`,
  [event.now,event.context.principal.userId,String(row.certificate_id),JSON.stringify({certificateNumber:row.certificate_number,registrationId:String(row.registration_id),
    status:row.certificate_status,eligibilityStatus:row.eligibility_status,attendancePercentage:Number(row.attendance_percentage),completionDate:row.completion_date,issueDate:row.issue_date}),
    event.context.ipAddress||null,event.context.userAgent?.slice(0,500)||null,event.context.correlationId||null]);
};
module.exports.createReportAudit = async(connection,event)=>{
  await connection.execute(`INSERT INTO audit_records (event_timestamp,actor_user_id,actor_role,action,entity_type,entity_id,result,
    change_summary,previous_value,new_value,access_scope,data_classification,ip_address,user_agent,correlation_id)
    VALUES (?,?,'TRAINING_ADMINISTRATOR',?,'REPORT_EXECUTION',?,?,?,NULL,?,'ALL_TRAINING_OPERATIONS','PERSONAL_DATA',?,?,?)`,
  [event.now,event.context.principal.userId,event.action,String(event.id),event.result,
    event.result==='FAILURE'?'Report generation failed.':event.action==='REPORT_DOWNLOADED'?'Report CSV prepared for download.':'Report generated.',
    JSON.stringify({reportType:event.definition.type,output:event.input.output,page:event.input.page,pageSize:event.input.pageSize}),
    event.context.ipAddress||null,event.context.userAgent?.slice(0,500)||null,event.context.correlationId||null]);
};
