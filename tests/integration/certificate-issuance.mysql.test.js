const mysql = require('../../src/node_modules/mysql2/promise');
const request = require('../../src/node_modules/supertest');
const fs = require('fs');
const path = require('path');
const enabled = process.env.WF014_TEST_DB_PORT && process.env.WF014_TEST_DB_NAME;
(enabled ? describe : describe.skip)('WF-014 isolated MySQL certificate issuance', () => {
  let admin, pool, app, trainerId, participantId, active, other, inactive, open, full, closed, sessions, cookie, token, managerId, systemAdminId;
  const database = process.env.WF014_TEST_DB_NAME;
  const saved = { ...process.env };
  beforeAll(async () => {
    if (!/^tms_wf014_[a-z0-9_]+_test$/.test(database)) throw new Error('Fresh dedicated WF-014 test database required.');
    admin = await mysql.createConnection({ host: process.env.WF014_TEST_DB_HOST || '127.0.0.1', port: Number(process.env.WF014_TEST_DB_PORT),
      user: process.env.WF014_TEST_DB_USER || 'root', password: process.env.WF014_TEST_DB_PASSWORD, multipleStatements: true, timezone: 'Z' });
    await admin.query(`CREATE DATABASE \`${database}\``);
    await admin.query(`USE \`${database}\``);
    for (const file of ['v1.0_participant-account-schema.sql', 'v1.1_participant-authentication-schema.sql', 'v1.2_program-catalogue-schema.sql', 'v1.3_registration-notification-outbox.sql', 'v1.4_attendance-management-schema.sql', 'v1.5_certificate-issuance-schema.sql']) {
      await admin.query(fs.readFileSync(path.join(__dirname, '../../db/migrations', file), 'utf8'));
    }
    Object.assign(process.env, { DB_HOST: process.env.WF014_TEST_DB_HOST || '127.0.0.1', DB_PORT: process.env.WF014_TEST_DB_PORT,
      DB_USER: process.env.WF014_TEST_DB_USER || 'root', DB_PASSWORD: process.env.WF014_TEST_DB_PASSWORD, DB_NAME: database, SESSION_SECRET: 'isolated-registration-secret-'.repeat(3), SESSION_COOKIE_SECURE: 'false' });
    const [actors] = await admin.query("SELECT account_identifier FROM users WHERE authentication_method='SYSTEM'");
    process.env.SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER = actors[0].account_identifier;
    pool = require('../../src/config/database'); app = require('../../src/app'); sessions = require('../../src/bindings/participant-authentication.bindings').sessions;
    const createUser = async role => {
      const [result] = await admin.execute(`INSERT INTO users (account_identifier, username, name, email, password_hash,
        role_id, role_name, permissions, access_scope, permitted_responsibilities, account_status,
        role_assigned_at, authentication_method, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'fixture-hash', ?, ?, '[]', '[]', '[]', 'ACTIVE', UTC_TIMESTAMP(), 'PASSWORD', UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
      ['A-' + role, role, role, role + '@example.test', role, role]);
      return result.insertId;
    };
    trainerId = await createUser('TRAINER'); systemAdminId=await createUser('SYSTEM_ADMINISTRATOR'); managerId = await createUser('TRAINING_ADMINISTRATOR');
    await admin.execute("UPDATE users SET permissions='[\"REGISTRATION_READ\"]', access_scope='[\"ALL_TRAINING_OPERATIONS\"]' WHERE user_id=?",[managerId]);
    const userId = await createUser('PARTICIPANT');
    const [profile] = await admin.execute("INSERT INTO participants (user_id,nric_passport_no,name,mobile_no,created_at,updated_at) VALUES (?,'fixture-nric','Participant','0123',UTC_TIMESTAMP(),UTC_TIMESTAMP())", [userId]);
    participantId = profile.insertId;
  }, 30000);
  async function category(name, status = 'ACTIVE') {
    const [result] = await admin.execute('INSERT INTO program_categories (name,status,created_at,updated_at) VALUES (?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())', [name, status]);
    return result.insertId;
  }
  async function program(code, status, categoryId = active, capacity = 2, date = '2026-12-01') {
    const [result] = await admin.execute(`INSERT INTO training_programs (code,name,description,objectives,target_audience,
      category_id,trainer_user_id,training_date,start_time,end_time,delivery_mode,capacity,registration_open_at,
      registration_close_at,status,certificate_eligibility_criteria,created_at,updated_at)
      VALUES (?,?,'Private description','Objectives','Audience',?,?,?,'09:00:00','10:00:00','ONLINE',?,
      '2026-10-01 00:00:00','2026-11-30 00:00:00',?,'ATTENDANCE',UTC_TIMESTAMP(),UTC_TIMESTAMP())`,
    [code, code, categoryId, trainerId, date, capacity, status]);
    return result.insertId;
  }
  async function registration(programId, reference, status = 'REGISTERED') {
    return admin.execute(`INSERT INTO registrations (reference_no,participant_id,program_id,registered_at,status,created_at,updated_at)
      VALUES (?,?,?,UTC_TIMESTAMP(),?,UTC_TIMESTAMP(),UTC_TIMESTAMP())`, [reference, participantId, programId, status]);
  }
  beforeEach(async () => {
    await admin.query('DELETE FROM certificates; DELETE FROM attendance; DELETE FROM registrations; DELETE FROM training_programs; DELETE FROM program_categories;');
    active = await category('Active <script>'); other = await category('Other'); inactive = await category('Hidden', 'INACTIVE');
    open = await program('A-open', 'OPEN'); full = await program('B-full', 'OPEN', other, 1); closed = await program('C-closed', 'CLOSED');
    await program('D-draft', 'DRAFT'); await program('E-completed', 'COMPLETED'); await program('F-cancelled', 'CANCELLED');
    await program('G-hidden', 'OPEN', inactive);
    await admin.query('DELETE FROM sessions; DELETE FROM audit_records; DELETE FROM notification_outbox;');
    await admin.query("UPDATE training_programs SET registration_open_at = UTC_TIMESTAMP() - INTERVAL 1 HOUR, registration_close_at = UTC_TIMESTAMP() + INTERVAL 1 HOUR");
    const auth = await managerSession(); cookie = auth.cookie; token = auth.token;
  });
  afterAll(async () => {
    if (pool) await pool.end(); if (admin) await admin.end();
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  });
  async function sessionFor(profileId) {
    const [profiles] = await admin.execute('SELECT user_id FROM participants WHERE participant_id=?', [profileId]);
    const connection = await pool.getConnection();
    try {
      const prepared = await sessions.prepare({ connection, now: new Date(), preparedSessionIds: [] }, {}, { userId: String(profiles[0].user_id), participantId: String(profileId), role: 'PARTICIPANT' });
      const cookie = 'tms.sid=' + prepared.cookiePlan.value;
      return { cookie, token: (await sessions.load({ headers: { cookie } })).csrfToken };
    } finally { connection.release(); }
  }

  async function managerSession(userId=managerId,role='TRAINING_ADMINISTRATOR') {
    const connection=await pool.getConnection();
    try {const prepared=await sessions.prepare({connection,now:new Date(),preparedSessionIds:[]},{},{userId:String(userId),role});
      const cookie='tms.sid='+prepared.cookiePlan.value;return {cookie,token:(await sessions.load({headers:{cookie}})).csrfToken};
    }finally{connection.release();}
  }



  const write=(registrationId,extra={})=>request(app).post('/api/v1/admin/certificates').set('Cookie',cookie).set('X-CSRF-Token',token).send({registrationId,certificateType:'COMPLETION',certificateTitle:'Course completed',...extra});
  async function source(programId=open,reference='R-cert',status='PRESENT',percentage=100,registrationStatus='REGISTERED'){
    await registration(programId,reference,registrationStatus);const [rows]=await admin.execute('SELECT registration_id FROM registrations WHERE reference_no=?',[reference]);const id=rows[0].registration_id;
    await admin.execute("INSERT INTO attendance (registration_id,participant_id,program_id,attendance_date,status,percentage,recorded_by,created_at,updated_at) VALUES (?,?,?,'2026-10-06',?,?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())",[id,participantId,programId,status,percentage,trainerId]);return id;
  }
  test('issuance exact seventeen fields, relationships, business dates and mandatory audit',async()=>{
    const id=await source();const result=await write(id,{issuingAuthority:'Academy',documentReference:'external-reference',verificationReference:'verification'}).expect(201);
    expect(Object.keys(result.body)).toHaveLength(17);expect(result.body).toMatchObject({registrationId:id,participantId,programId:open,issuedBy:managerId,eligibilityStatus:'ELIGIBLE',eligibilityResult:'100% attendance achieved',attendancePercentage:100,completionDate:'2026-10-06',certificateStatus:'ISSUED'});expect(result.body.certificateNumber).toMatch(/^C-[0-9A-HJKMNP-TV-Z]{26}$/);
    const [rows]=await admin.query('SELECT * FROM certificates');expect(rows).toHaveLength(1);expect(rows[0].document_reference).toBe('external-reference');
    const [events]=await admin.query("SELECT * FROM audit_records WHERE action='CERTIFICATE_ISSUED'");expect(events).toHaveLength(1);expect(events[0].actor_user_id).toBe(managerId);expect(events[0].access_scope).toBe('ALL_TRAINING_OPERATIONS');expect((await admin.query('SELECT * FROM notification_outbox'))[0]).toEqual([]);
    await write(id).expect(409);
  });
  test('missing registration/attendance, sub-100, ABSENT and cancelled sources are 400',async()=>{
    await write(999999).expect(400);
    const missing=await source();await admin.execute('DELETE FROM attendance WHERE registration_id=?',[missing]);await write(missing).expect(400);
    await write(await source(full,'R-low','PRESENT',99)).expect(400);await write(await source(closed,'R-absent','ABSENT',100)).expect(400);
    const cancelled=await source(await program('cancel-source','CLOSED'),'R-cancel','PRESENT',100,'CANCELLED');await write(cancelled).expect(400);
  });
  test('concurrent duplicate issuance returns one 201, one 409 and one audit',async()=>{
    const id=await source(),results=await Promise.all([write(id),write(id)]);expect(results.map(r=>r.status).sort()).toEqual([201,409]);expect((await admin.query('SELECT * FROM certificates'))[0]).toHaveLength(1);expect((await admin.query("SELECT * FROM audit_records WHERE action='CERTIFICATE_ISSUED'"))[0]).toHaveLength(1);
  });
  test('real reference collisions retry and exhausted attempts roll back without 409',async()=>{
    const first=await write(await source()).expect(201),second=await source(full,'R-reference-second');
    const binding=require('../../src/bindings/certificate-eligibility-issuance.bindings'),original=binding.repository.insertWithReferenceRetry;
    const {makeCertificateRepository}=require('../../src/repositories/certificate-eligibility-issuance.repository'),{errors}=require('../../src/auth/authentication-errors'),{ulid}=require('../../src/node_modules/ulid');
    const reference=jest.fn().mockReturnValueOnce(first.body.certificateNumber).mockReturnValue('C-'+ulid());
    binding.repository.insertWithReferenceRetry=makeCertificateRepository({pool,errors,reference,attempts:3}).insertWithReferenceRetry;
    try{await write(second).expect(201);expect(reference).toHaveBeenCalledTimes(2);}finally{binding.repository.insertWithReferenceRetry=original;}
    const exhausted=jest.fn(()=>first.body.certificateNumber),third=await source(closed,'R-reference-third');
    binding.repository.insertWithReferenceRetry=makeCertificateRepository({pool,errors,reference:exhausted,attempts:3}).insertWithReferenceRetry;
    try{const failed=await write(third).expect(500);expect(failed.body.message).toBe('An unexpected error occurred.');expect(exhausted).toHaveBeenCalledTimes(3);expect((await admin.query('SELECT * FROM certificates'))[0]).toHaveLength(2);}finally{binding.repository.insertWithReferenceRetry=original;}
  });
  test('attendance downgrade race rechecks eligibility and preserves issued snapshot',async()=>{
    const id=await source(),auth=await managerSession(trainerId,'TRAINER');
    const results=await Promise.all([write(id),request(app).post('/api/v1/trainer/programs/'+open+'/attendance').set('Cookie',auth.cookie).set('X-CSRF-Token',auth.token).send({attendanceDate:'2026-10-06',records:[{registrationId:id,status:'ABSENT'}]})]);
    expect(results[1].status).toBe(200);expect([201,400]).toContain(results[0].status);const [rows]=await admin.query('SELECT * FROM certificates');expect(rows).toHaveLength(results[0].status===201?1:0);if(rows.length)expect(Number(rows[0].attendance_percentage)).toBe(100);
  });
  test('cancellation race rechecks registration status and preserves issued history',async()=>{
    const id=await source(),auth=await sessionFor(participantId);
    const results=await Promise.all([write(id),request(app).post('/api/v1/registrations/'+id+'/cancel').set('Cookie',auth.cookie).set('X-CSRF-Token',auth.token).send({})]);
    expect(results[1].status).toBe(200);expect([201,400]).toContain(results[0].status);expect((await admin.query('SELECT * FROM certificates'))[0]).toHaveLength(results[0].status===201?1:0);
  });
  test('audit failure rolls back certificate and reference reservation',async()=>{
    const id=await source();await admin.query("CREATE TRIGGER wf014_fail_audit BEFORE INSERT ON audit_records FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture audit failure'");
    try{await write(id).expect(500);expect((await admin.query('SELECT * FROM certificates'))[0]).toHaveLength(0);}finally{await admin.query('DROP TRIGGER wf014_fail_audit');}await write(id).expect(201);
  });
  test('immutable source relationships fail closed on corrupted attendance',async()=>{
    const id=await source();await admin.execute('UPDATE attendance SET program_id=? WHERE registration_id=?',[full,id]);await write(id).expect(500);expect((await admin.query('SELECT * FROM certificates'))[0]).toHaveLength(0);
  });
  test.each(['completionDate','issuedBy','certificateNumber','certificateStatus','participantId','programId','eligibilityStatus','attendancePercentage','issueDate'])('client authority %s rejected',async key=>{const id=await source();await write(id,{[key]:'spoofed'}).expect(400);});
  test('authentication, all other roles and CSRF enforced',async()=>{
    const id=await source();await request(app).post('/api/v1/admin/certificates').send({}).expect(401);
    for(const auth of [await sessionFor(participantId),await managerSession(trainerId,'TRAINER'),await managerSession(systemAdminId,'SYSTEM_ADMINISTRATOR')]){
      await request(app).post('/api/v1/admin/certificates').set('Cookie',auth.cookie).set('X-CSRF-Token',auth.token).send({registrationId:id,certificateType:'T',certificateTitle:'Title'}).expect(403);await request(app).get('/admin/certificates').set('Cookie',auth.cookie).expect(403);
    }
    await request(app).post('/api/v1/admin/certificates').set('Cookie',cookie).send({registrationId:id,certificateType:'T',certificateTitle:'Title'}).expect(403);
  });
  test('live account/session recheck precedes issuance',async()=>{
    const id=await source(),binding=require('../../src/bindings/certificate-eligibility-issuance.bindings'),original=binding.authorization.assertCreator;
    binding.authorization.assertCreator=async(connection,context)=>{await admin.execute("UPDATE users SET account_status='DISABLED' WHERE user_id=?",[managerId]);return original(connection,context);};
    try{await write(id).expect(403);}finally{binding.authorization.assertCreator=original;await admin.execute("UPDATE users SET account_status='ACTIVE' WHERE user_id=?",[managerId]);}
    binding.authorization.assertCreator=async(connection,context)=>{await admin.execute('UPDATE sessions SET expires_at=UTC_TIMESTAMP()-INTERVAL 1 MINUTE WHERE session_id=?',[context.sessionId]);return original(connection,context);};
    try{await write(id).expect(401);}finally{binding.authorization.assertCreator=original;}expect((await admin.query('SELECT * FROM certificates'))[0]).toHaveLength(0);
  });
  test('eligible selectors are program-scoped and safely escaped; issued registrations disappear',async()=>{
    const id=await source();await source(full,'R-other');await admin.execute("UPDATE participants SET name='<script>Participant</script>' WHERE participant_id=?",[participantId]);
    let page=await request(app).get('/admin/certificates?programId='+open).set('Cookie',cookie).expect(200);expect(page.text).toContain('R-cert');expect(page.text).not.toContain('R-other');expect(page.text).toContain('&lt;script&gt;Participant&lt;/script&gt;');expect(page.text).toContain('readonly');expect(page.text).not.toContain('fixture-nric');
    await write(id).expect(201);page=await request(app).get('/admin/certificates?programId='+open).set('Cookie',cookie).expect(200);expect(page.text).not.toContain('R-cert');
    await request(app).get('/api/v1/admin/certificates').set('Cookie',cookie).expect(404);
  });
});
