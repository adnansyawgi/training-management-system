const mysql = require('../../src/node_modules/mysql2/promise');
const request = require('../../src/node_modules/supertest');
const fs = require('fs');
const path = require('path');
const enabled = process.env.WF015_TEST_DB_PORT && process.env.WF015_TEST_DB_NAME;
(enabled ? describe : describe.skip)('WF-015 isolated MySQL report generation', () => {
  let admin, pool, app, trainerId, participantId, active, other, inactive, open, full, closed, sessions, cookie, token, managerId, systemAdminId;
  const database = process.env.WF015_TEST_DB_NAME;
  const saved = { ...process.env };
  beforeAll(async () => {
    if (!/^tms_wf015_[a-z0-9_]+_test$/.test(database)) throw new Error('Fresh dedicated WF-015 test database required.');
    admin = await mysql.createConnection({ host: process.env.WF015_TEST_DB_HOST || '127.0.0.1', port: Number(process.env.WF015_TEST_DB_PORT),
      user: process.env.WF015_TEST_DB_USER || 'root', password: process.env.WF015_TEST_DB_PASSWORD, multipleStatements: true, timezone: 'Z' });
    await admin.query(`CREATE DATABASE \`${database}\``);
    await admin.query(`USE \`${database}\``);
    for (const file of ['v1.0_participant-account-schema.sql', 'v1.1_participant-authentication-schema.sql', 'v1.2_program-catalogue-schema.sql', 'v1.3_registration-notification-outbox.sql', 'v1.4_attendance-management-schema.sql', 'v1.5_certificate-issuance-schema.sql', 'v1.6_report-generation-schema.sql']) {
      await admin.query(fs.readFileSync(path.join(__dirname, '../../db/migrations', file), 'utf8'));
    }
    Object.assign(process.env, { DB_HOST: process.env.WF015_TEST_DB_HOST || '127.0.0.1', DB_PORT: process.env.WF015_TEST_DB_PORT,
      DB_USER: process.env.WF015_TEST_DB_USER || 'root', DB_PASSWORD: process.env.WF015_TEST_DB_PASSWORD, DB_NAME: database, SESSION_SECRET: 'isolated-registration-secret-'.repeat(3), SESSION_COOKIE_SECURE: 'false' });
    const [actors] = await admin.query("SELECT account_identifier FROM users WHERE authentication_method='SYSTEM'");
    process.env.SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER = actors[0].account_identifier;
    pool = require('../../src/config/database'); app = require('../../src/app'); sessions = require('../../src/participant-authentication.bindings').sessions;
    const createUser = async role => {
      const [result] = await admin.execute(`INSERT INTO users (account_identifier, username, name, email, password_hash,
        role_id, role_name, permissions, access_scope, permitted_responsibilities, account_status,
        role_assigned_at, authentication_method, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'fixture-hash', ?, ?, '[]', '[]', '[]', 'ACTIVE', UTC_TIMESTAMP(), 'PASSWORD', UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
      ['A-' + role, role, role, role + '@example.test', role, role]);
      return result.insertId;
    };
    trainerId = await createUser('TRAINER'); systemAdminId=await createUser('SYSTEM_ADMINISTRATOR'); managerId = await createUser('TRAINING_ADMINISTRATOR');
    await admin.execute("UPDATE users SET permissions='[\"REGISTRATION_READ\",\"REPORT_GENERATE\"]', access_scope='[\"ALL_TRAINING_OPERATIONS\"]' WHERE user_id=?",[managerId]);
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
    await admin.query('DELETE FROM report_executions; DELETE FROM certificates; DELETE FROM attendance; DELETE FROM registrations; DELETE FROM training_programs; DELETE FROM program_categories;');
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




  const period={periodFrom:'2026-10-01T00:00:00Z',periodTo:'2026-11-01T00:00:00Z'};
  const report=(type='registrations',query={})=>request(app).get('/api/v1/admin/reports/'+type+'?'+new URLSearchParams({...period,...query})).set('Cookie',cookie);
  async function creationAudits(){
    const audit=require('../../src/repositories/audit.repository'),[profiles]=await admin.execute('SELECT user_id FROM participants WHERE participant_id=?',[participantId]);
    await audit.createParticipantSelfRegistrationAudit(admin,{createdAt:new Date(),participantId,userId:profiles[0].user_id});
    for(const [id,role] of [[trainerId,'TRAINER'],[managerId,'TRAINING_ADMINISTRATOR']])await audit.createAdministrativeUserAudit(admin,{occurredAt:new Date(),actorUserId:systemAdminId,userId:id,role,context:{}});
  }
  async function registrations(){await registration(open,'R-report');await registration(full,'R-cancelled','CANCELLED');await admin.query("UPDATE registrations SET registered_at='2026-10-07 01:00:00'");return (await admin.query('SELECT registration_id FROM registrations ORDER BY registration_id'))[0].map(row=>row.registration_id);}
  test('registration fixed eleven columns, JSON default and SUCCESS metadata/audit',async()=>{
    await registrations();const result=await report().expect(200);expect(Object.keys(result.body)).toHaveLength(12);expect(Object.keys(result.body.data[0])).toHaveLength(11);expect(result.body).toMatchObject({reportType:'STUDENT_PROGRAM_REGISTRATION',status:'SUCCESS',generatedBy:managerId,total:2,page:1,pageSize:20});
    expect(JSON.stringify(result.body)).not.toMatch(/fixture-nric|password_hash|session_id/);const [execution]=await admin.query('SELECT * FROM report_executions');expect(execution).toHaveLength(1);expect(execution[0].status).toBe('SUCCESS');expect((await admin.query("SELECT * FROM audit_records WHERE action='REPORT_GENERATED'"))[0]).toHaveLength(1);
  });
  test('certificate report business-midnight period and issuer display name',async()=>{
    const [id]=await registrations();await admin.execute("INSERT INTO attendance (registration_id,participant_id,program_id,attendance_date,status,percentage,recorded_by,created_at,updated_at) VALUES (?,?,?,'2026-10-06','PRESENT',100,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())",[id,participantId,open,trainerId]);
    await request(app).post('/api/v1/admin/certificates').set('Cookie',cookie).set('X-CSRF-Token',token).send({registrationId:id,certificateType:'COMPLETION',certificateTitle:'Title'}).expect(201);await admin.query("UPDATE certificates SET issue_date='2026-10-07'");
    const result=await report('certificates',{periodFrom:'2026-10-06T16:00:00Z',periodTo:'2026-10-07T16:00:00Z'}).expect(200);expect(result.body.total).toBe(1);expect(Object.keys(result.body.data[0])).toHaveLength(11);expect(result.body.data[0].issuedBy).toBe('TRAINING_ADMINISTRATOR');
    expect((await report('certificates',{periodFrom:'2026-10-06T16:00:01Z',periodTo:'2026-10-07T16:00:00Z'}).expect(200)).body.total).toBe(0);
  });
  test('account-rooted report includes staff null columns and exact creation attribution',async()=>{
    await creationAudits();const result=await report('accounts').expect(200);expect(result.body.total).toBe(3);expect(result.body.data.every(row=>Object.keys(row).length===8)).toBe(true);
    expect(result.body.data.find(row=>row.participantId===participantId)).toMatchObject({createdBy:'SELF-REGISTRATION',mobileNo:'0123'});
    expect(result.body.data.filter(row=>row.participantId===null)).toHaveLength(2);expect(result.body.data.filter(row=>row.participantId===null).every(row=>row.mobileNo===null&&row.createdBy==='A-SYSTEM_ADMINISTRATOR')).toBe(true);expect(JSON.stringify(result.body)).not.toContain('fixture-nric');
    expect((await report('accounts',{participantId}).expect(200)).body.total).toBe(1);
  });
  test('missing or ambiguous account attribution fails closed with FAILED execution',async()=>{
    await report('accounts').expect(500);expect((await admin.query('SELECT status FROM report_executions'))[0][0].status).toBe('FAILED');await creationAudits();await creationAudits();await report('accounts').expect(500);
    expect((await admin.query("SELECT * FROM report_executions WHERE status='SUCCESS'"))[0]).toHaveLength(0);expect((await admin.query("SELECT * FROM audit_records WHERE action='REPORT_GENERATION_FAILED'"))[0]).toHaveLength(2);
  });
  test('filters, inclusive/exclusive periods, equal bounds and deterministic pages',async()=>{
    const ids=await registrations();expect((await report('registrations',{programId:open}).expect(200)).body.total).toBe(1);expect((await report('registrations',{categoryId:other,status:'CANCELLED'}).expect(200)).body.total).toBe(1);
    expect((await report('registrations',{page:2,pageSize:1}).expect(200)).body.data[0].registrationId).toBe(ids[1]);expect((await report('registrations',{periodFrom:'2026-10-07T01:00:00Z',periodTo:'2026-10-07T01:00:00Z'}).expect(200)).body.total).toBe(0);
  });
  test('CSV exports requested page, guards formula cells and audits download',async()=>{
    await registrations();await admin.execute("UPDATE participants SET name=' =SUM(A1)' WHERE participant_id=?",[participantId]);
    const result=await report('registrations',{output:'csv',pageSize:1,page:2}).expect(200);expect(result.headers['content-type']).toContain('text/csv');expect(result.headers['content-disposition']).toContain('registrations-report.csv');expect(result.text).toContain("' =SUM(A1)");expect(result.text).toContain('R-cancelled'===result.text?'':'"CANCELLED"');expect(result.text.trim().split('\r\n')).toHaveLength(2);
    expect((await admin.query("SELECT * FROM audit_records WHERE action='REPORT_DOWNLOADED'"))[0]).toHaveLength(1);
  });
  test.each([{pageSize:101},{participantId:'9007199254740992'},{programId:0},{status:'APPROVED'},{output:'pdf'},{periodFrom:'2026-02-30T00:00:00Z'},{accountStatus:'ACTIVE'},{sort:'name'}])('strict endpoint query %j',async query=>{await report('registrations',query).expect(400);});
  test('anonymous, other roles and revoked report grants denied',async()=>{
    await request(app).get('/api/v1/admin/reports/accounts?'+new URLSearchParams(period)).expect(401);
    for(const auth of [await sessionFor(participantId),await managerSession(trainerId,'TRAINER'),await managerSession(systemAdminId,'SYSTEM_ADMINISTRATOR')])await request(app).get('/api/v1/admin/reports/registrations?'+new URLSearchParams(period)).set('Cookie',auth.cookie).expect(403);
    await admin.execute("UPDATE users SET permissions='[]' WHERE user_id=?",[managerId]);try{await report().expect(403);await request(app).get('/admin/reports').set('Cookie',cookie).expect(403);}finally{await admin.execute("UPDATE users SET permissions='[\"REGISTRATION_READ\",\"REPORT_GENERATE\"]' WHERE user_id=?",[managerId]);}
    expect((await admin.query('SELECT * FROM report_executions'))[0]).toHaveLength(0);
  });
  test('serialization failure records FAILED, never SUCCESS',async()=>{
    const binding=require('../../src/report-generation.bindings'),original=binding.reports.read;binding.reports.read=async()=>({rows:[{}],total:1});
    try{await report().expect(500);}finally{binding.reports.read=original;}
    expect((await admin.query('SELECT status FROM report_executions'))[0]).toEqual([{status:'FAILED'}]);expect((await admin.query("SELECT * FROM audit_records WHERE action='REPORT_GENERATED'"))[0]).toHaveLength(0);
  });
  test('mandatory success audit failure reverts completion and journals FAILED',async()=>{
    await admin.query("CREATE TRIGGER wf015_fail_success BEFORE INSERT ON audit_records FOR EACH ROW BEGIN IF NEW.action='REPORT_GENERATED' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture success audit failure'; END IF; END");
    try{await report().expect(500);expect((await admin.query('SELECT status FROM report_executions'))[0]).toEqual([{status:'FAILED'}]);expect((await admin.query("SELECT * FROM audit_records WHERE action='REPORT_GENERATION_FAILED'"))[0]).toHaveLength(1);}finally{await admin.query('DROP TRIGGER wf015_fail_success');}
  });
  test('report page and navigation use existing conventions',async()=>{
    const page=await request(app).get('/admin/reports').set('Cookie',cookie).expect(200);expect(page.headers['cache-control']).toBe('no-store');expect(page.text).toContain('Student Account Creation Report');expect(page.text).toContain('/js/reports.js');await request(app).get('/admin/programs').set('Cookie',cookie).expect(200);
  });
});
