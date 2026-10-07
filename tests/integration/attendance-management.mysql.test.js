const mysql = require('../../src/node_modules/mysql2/promise');
const request = require('../../src/node_modules/supertest');
const fs = require('fs');
const path = require('path');
const enabled = process.env.WF013_TEST_DB_PORT && process.env.WF013_TEST_DB_NAME;
(enabled ? describe : describe.skip)('WF-013 isolated MySQL attendance management', () => {
  let admin, pool, app, trainerId, participantId, active, other, inactive, open, full, closed, sessions, cookie, token, managerId, systemAdminId;
  const database = process.env.WF013_TEST_DB_NAME;
  const saved = { ...process.env };
  beforeAll(async () => {
    if (!/^tms_wf013_[a-z0-9_]+_test$/.test(database)) throw new Error('Fresh dedicated WF-013 test database required.');
    admin = await mysql.createConnection({ host: process.env.WF013_TEST_DB_HOST || '127.0.0.1', port: Number(process.env.WF013_TEST_DB_PORT),
      user: process.env.WF013_TEST_DB_USER || 'root', password: process.env.WF013_TEST_DB_PASSWORD, multipleStatements: true, timezone: 'Z' });
    await admin.query(`CREATE DATABASE \`${database}\``);
    await admin.query(`USE \`${database}\``);
    for (const file of ['v1.0_participant-account-schema.sql', 'v1.1_participant-authentication-schema.sql', 'v1.2_program-catalogue-schema.sql', 'v1.3_registration-notification-outbox.sql', 'v1.4_attendance-management-schema.sql']) {
      await admin.query(fs.readFileSync(path.join(__dirname, '../../db/migrations', file), 'utf8'));
    }
    Object.assign(process.env, { DB_HOST: process.env.WF013_TEST_DB_HOST || '127.0.0.1', DB_PORT: process.env.WF013_TEST_DB_PORT,
      DB_USER: process.env.WF013_TEST_DB_USER || 'root', DB_PASSWORD: process.env.WF013_TEST_DB_PASSWORD, DB_NAME: database, SESSION_SECRET: 'isolated-registration-secret-'.repeat(3), SESSION_COOKIE_SECURE: 'false' });
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
    await admin.query('DELETE FROM attendance; DELETE FROM registrations; DELETE FROM training_programs; DELETE FROM program_categories;');
    active = await category('Active <script>'); other = await category('Other'); inactive = await category('Hidden', 'INACTIVE');
    open = await program('A-open', 'OPEN'); full = await program('B-full', 'OPEN', other, 1); closed = await program('C-closed', 'CLOSED');
    await program('D-draft', 'DRAFT'); await program('E-completed', 'COMPLETED'); await program('F-cancelled', 'CANCELLED');
    await program('G-hidden', 'OPEN', inactive);
    await admin.query('DELETE FROM sessions; DELETE FROM audit_records; DELETE FROM notification_outbox;');
    await admin.query("UPDATE training_programs SET registration_open_at = UTC_TIMESTAMP() - INTERVAL 1 HOUR, registration_close_at = UTC_TIMESTAMP() + INTERVAL 1 HOUR");
    const auth = await managerSession(trainerId,'TRAINER'); cookie = auth.cookie; token = auth.token;
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


  const write=(programId,records,extra={})=>request(app).post('/api/v1/trainer/programs/'+programId+'/attendance').set('Cookie',cookie).set('X-CSRF-Token',token).send({attendanceDate:'2026-10-07',records,...extra});
  async function seed(programId=open,reference='R-attendance',status='REGISTERED'){await registration(programId,reference,status);const [rows]=await admin.execute('SELECT registration_id FROM registrations WHERE reference_no=?',[reference]);return rows[0].registration_id;}
  test('create exact eight fields, derive immutable relationships, percentage and Trainer actor',async()=>{
    const id=await seed();const result=await write(open,[{registrationId:id,status:'PRESENT',checkInAt:'2026-10-07T09:00:00+08:00',remarks:'Saved remark'}]).expect(200);
    expect(Object.keys(result.body)).toEqual(['items']);expect(Object.keys(result.body.items[0])).toHaveLength(8);expect(result.body.items[0]).toMatchObject({registrationId:id,participantId,programId:open,percentage:100,recordedBy:trainerId,status:'PRESENT'});
    const [rows]=await admin.query('SELECT * FROM attendance');expect(rows[0].check_in_at.toISOString()).toBe('2026-10-07T01:00:00.000Z');expect(rows[0].remarks).toBe('Saved remark');
    const [events]=await admin.query("SELECT * FROM audit_records WHERE action='ATTENDANCE_CREATED'");expect(events).toHaveLength(1);expect(events[0].actor_user_id).toBe(trainerId);expect(events[0].access_scope).toBe('ASSIGNED_PROGRAMS');expect((await admin.query('SELECT * FROM notification_outbox'))[0]).toHaveLength(0);
  });
  test('maintenance preserves attendance ID, relationships and creation timestamp',async()=>{
    const id=await seed();const first=await write(open,[{registrationId:id,status:'PRESENT',remarks:'Before'}]).expect(200);const before=(await admin.query('SELECT * FROM attendance'))[0][0];
    const result=await write(open,[{registrationId:id,status:'ABSENT'}]).expect(200);expect(result.body.items[0].attendanceId).toBe(first.body.items[0].attendanceId);expect(result.body.items[0].percentage).toBe(0);
    const after=(await admin.query('SELECT * FROM attendance'))[0][0];expect(after.created_at).toEqual(before.created_at);expect(after.remarks).toBeNull();expect(after.participant_id).toBe(before.participant_id);expect(after.program_id).toBe(before.program_id);
    expect((await admin.query("SELECT * FROM audit_records WHERE action='ATTENDANCE_UPDATED'"))[0]).toHaveLength(1);
  });
  test('batch invalid target or late audit failure rolls back every record',async()=>{
    const first=await seed();const second=await seed(full,'R-second');
    await write(open,[{registrationId:first,status:'PRESENT'},{registrationId:second,status:'PRESENT'}]).expect(400);expect((await admin.query('SELECT * FROM attendance'))[0]).toHaveLength(0);
    const [user]=await admin.execute("INSERT INTO users (account_identifier,username,name,email,password_hash,role_id,role_name,permissions,access_scope,permitted_responsibilities,account_status,role_assigned_at,created_at,updated_at) SELECT 'A-attendance-second','attendance-second','Second','attendance-second@example.test',password_hash,role_id,role_name,permissions,access_scope,permitted_responsibilities,account_status,role_assigned_at,created_at,updated_at FROM users WHERE role_id='PARTICIPANT'");
    const [profile]=await admin.execute("INSERT INTO participants (user_id,nric_passport_no,name,mobile_no,created_at,updated_at) VALUES (?,'attendance-second','Second','0123',UTC_TIMESTAMP(),UTC_TIMESTAMP())",[user.insertId]);
    await admin.execute('UPDATE registrations SET participant_id=?,program_id=? WHERE registration_id=?',[profile.insertId,open,second]);
    await admin.query("CREATE TRIGGER wf013_fail_audit BEFORE INSERT ON audit_records FOR EACH ROW BEGIN IF JSON_UNQUOTE(JSON_EXTRACT(NEW.new_value,'$.evidenceReference'))='fail-late' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture audit failure'; END IF; END");
    try {
      const batch=[{registrationId:first,status:'PRESENT'},{registrationId:second,status:'PRESENT',evidenceReference:'fail-late'}];
      await write(open,batch).expect(500);expect((await admin.query('SELECT * FROM attendance'))[0]).toHaveLength(0);expect((await admin.query('SELECT * FROM audit_records'))[0]).toHaveLength(0);
      await write(open,[batch[0]]).expect(200);batch[0].status='ABSENT';await write(open,batch).expect(500);
      expect((await admin.query('SELECT * FROM attendance'))[0]).toHaveLength(1);expect((await admin.query('SELECT * FROM attendance'))[0][0].status).toBe('PRESENT');expect((await admin.query('SELECT * FROM audit_records'))[0]).toHaveLength(1);
    } finally {await admin.query('DROP TRIGGER wf013_fail_audit');}
  });
  test('concurrent create/maintenance leaves one row and transactional audits',async()=>{
    const id=await seed();const results=await Promise.all([write(open,[{registrationId:id,status:'PRESENT'}]),write(open,[{registrationId:id,status:'ABSENT'}])]);expect(results.map(r=>r.status)).toEqual([200,200]);
    expect((await admin.query('SELECT * FROM attendance'))[0]).toHaveLength(1);expect((await admin.query("SELECT * FROM audit_records WHERE action IN ('ATTENDANCE_CREATED','ATTENDANCE_UPDATED')"))[0]).toHaveLength(2);
  });
  test.each([{percentage:75},{recordedBy:8},{participantId:9},{programId:8},{status:'LATE'},{registrationId:'2'},{remarks:'x'.repeat(501)},{verificationMethod:'x'.repeat(51)},{evidenceReference:'x'.repeat(256)}])('rejects non-authoritative/invalid record %j',async change=>{
    const id=await seed();await write(open,[{registrationId:id,status:'PRESENT',...change}]).expect(400);
  });
  test('duplicate IDs, cancelled and missing targets; missing program; empty batch per source',async()=>{
    const id=await seed(),cancelled=await seed(full,'R-cancelled','CANCELLED');await write(open,[{registrationId:id,status:'PRESENT'},{registrationId:id,status:'ABSENT'}]).expect(400);
    await write(full,[{registrationId:cancelled,status:'PRESENT'}]).expect(400);await write(open,[{registrationId:999999,status:'PRESENT'}]).expect(404);await write(999999,[]).expect(404);expect((await write(open,[]).expect(200)).body).toEqual({items:[]});
  });
  test('anonymous, other roles, assignment and CSRF enforced on pages and API',async()=>{
    const id=await seed();await request(app).post('/api/v1/trainer/programs/'+open+'/attendance').send({attendanceDate:'2026-10-07',records:[]}).expect(401);
    for(const auth of [await sessionFor(participantId),await managerSession(),await managerSession(systemAdminId,'SYSTEM_ADMINISTRATOR')]){
      await request(app).post('/api/v1/trainer/programs/'+open+'/attendance').set('Cookie',auth.cookie).set('X-CSRF-Token',auth.token).send({attendanceDate:'2026-10-07',records:[]}).expect(403);
      await request(app).get('/trainer/programs').set('Cookie',auth.cookie).expect(403);
    }
    await request(app).post('/api/v1/trainer/programs/'+open+'/attendance').set('Cookie',cookie).send({attendanceDate:'2026-10-07',records:[]}).expect(403);
    await admin.execute('UPDATE training_programs SET trainer_user_id=? WHERE program_id=?',[managerId,open]);await write(open,[{registrationId:id,status:'PRESENT'}]).expect(403);await request(app).get('/trainer/programs/'+open+'/attendance').set('Cookie',cookie).expect(403);
  });
  test('live Trainer and session are revalidated within the batch transaction',async()=>{
    const id=await seed(),binding=require('../../src/attendance-management.bindings'),original=binding.authorization.assertCreator;
    binding.authorization.assertCreator=async(connection,context)=>{await admin.execute("UPDATE users SET account_status='DISABLED' WHERE user_id=?",[trainerId]);return original(connection,context);};
    try{await write(open,[{registrationId:id,status:'PRESENT'}]).expect(403);}finally{binding.authorization.assertCreator=original;await admin.execute("UPDATE users SET account_status='ACTIVE' WHERE user_id=?",[trainerId]);}
    binding.authorization.assertCreator=async(connection,context)=>{await admin.execute('UPDATE sessions SET expires_at=UTC_TIMESTAMP()-INTERVAL 1 MINUTE WHERE session_id=?',[context.sessionId]);return original(connection,context);};
    try{await write(open,[{registrationId:id,status:'PRESENT'}]).expect(401);}finally{binding.authorization.assertCreator=original;}
    expect((await admin.query('SELECT * FROM attendance'))[0]).toHaveLength(0);
  });
  test('cancellation and attendance race retains coherent registration history',async()=>{
    const id=await seed(),auth=await sessionFor(participantId);
    const results=await Promise.all([write(open,[{registrationId:id,status:'PRESENT'}]),request(app).post('/api/v1/registrations/'+id+'/cancel').set('Cookie',auth.cookie).set('X-CSRF-Token',auth.token).send({})]);
    expect(results[1].status).toBe(200);expect([200,400]).toContain(results[0].status);expect((await admin.query('SELECT status FROM registrations'))[0][0].status).toBe('CANCELLED');
    expect((await admin.query('SELECT * FROM attendance'))[0]).toHaveLength(results[0].status===200?1:0);
  });
  test('server-rendered roster is scoped, escaped, REGISTERED-only and restores saved attendance',async()=>{
    const id=await seed();await seed(full,'R-cancelled','CANCELLED');await admin.execute("UPDATE participants SET name='<script>Participant</script>' WHERE participant_id=?",[participantId]);
    await write(open,[{registrationId:id,status:'ABSENT',remarks:'<script>saved</script>'}]).expect(200);
    const page=await request(app).get('/trainer/programs/'+open+'/attendance').set('Cookie',cookie).expect(200);expect(page.headers['cache-control']).toBe('no-store');expect(page.text).toContain('&lt;script&gt;Participant&lt;/script&gt;');expect(page.text).toContain('&lt;script&gt;saved&lt;/script&gt;');expect(page.text).toContain('ABSENT');expect(page.text).not.toContain('fixture-nric');
    await request(app).get('/trainer/programs').set('Cookie',cookie).expect(200);
    const cancelled=await request(app).get('/trainer/programs/'+full+'/attendance').set('Cookie',cookie).expect(200);expect(cancelled.text).not.toContain('R-cancelled');
  });
});
