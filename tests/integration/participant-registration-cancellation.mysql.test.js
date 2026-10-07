const mysql = require('../../src/node_modules/mysql2/promise');
const request = require('../../src/node_modules/supertest');
const fs = require('fs');
const path = require('path');
const { makeCatalogueRepository } = require('../../src/repositories/program-catalogue.repository');
const enabled = process.env.WF010_TEST_DB_PORT && process.env.WF010_TEST_DB_NAME;
(enabled ? describe : describe.skip)('WF-010 isolated MySQL catalogue', () => {
  let admin, pool, app, trainerId, participantId, active, other, inactive, open, full, closed, sessions, cookie, token;
  const database = process.env.WF010_TEST_DB_NAME;
  const saved = { ...process.env };
  beforeAll(async () => {
    if (!/^tms_wf010_[a-z0-9_]+_test$/.test(database)) throw new Error('Fresh dedicated WF-010 test database required.');
    admin = await mysql.createConnection({ host: process.env.WF010_TEST_DB_HOST || '127.0.0.1', port: Number(process.env.WF010_TEST_DB_PORT),
      user: process.env.WF010_TEST_DB_USER || 'root', password: process.env.WF010_TEST_DB_PASSWORD, multipleStatements: true });
    await admin.query(`CREATE DATABASE \`${database}\``);
    await admin.query(`USE \`${database}\``);
    for (const file of ['v1.0_participant-account-schema.sql', 'v1.1_participant-authentication-schema.sql', 'v1.2_program-catalogue-schema.sql', 'v1.3_registration-notification-outbox.sql']) {
      await admin.query(fs.readFileSync(path.join(__dirname, '../../db/migrations', file), 'utf8'));
    }
    Object.assign(process.env, { DB_HOST: process.env.WF010_TEST_DB_HOST || '127.0.0.1', DB_PORT: process.env.WF010_TEST_DB_PORT,
      DB_USER: process.env.WF010_TEST_DB_USER || 'root', DB_PASSWORD: process.env.WF010_TEST_DB_PASSWORD, DB_NAME: database, SESSION_SECRET: 'isolated-registration-secret-'.repeat(3), SESSION_COOKIE_SECURE: 'false' });
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
    trainerId = await createUser('TRAINER');
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
    await admin.query('DELETE FROM registrations; DELETE FROM training_programs; DELETE FROM program_categories;');
    active = await category('Active <script>'); other = await category('Other'); inactive = await category('Hidden', 'INACTIVE');
    open = await program('A-open', 'OPEN'); full = await program('B-full', 'OPEN', other, 1); closed = await program('C-closed', 'CLOSED');
    await program('D-draft', 'DRAFT'); await program('E-completed', 'COMPLETED'); await program('F-cancelled', 'CANCELLED');
    await program('G-hidden', 'OPEN', inactive);
    await admin.query('DELETE FROM sessions; DELETE FROM audit_records; DELETE FROM notification_outbox;');
    await admin.query("UPDATE training_programs SET registration_open_at = UTC_TIMESTAMP() - INTERVAL 1 HOUR, registration_close_at = UTC_TIMESTAMP() + INTERVAL 1 HOUR");
    const auth = await sessionFor(participantId); cookie = auth.cookie; token = auth.token;
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
  const register = (programId = open, auth = { cookie, token }, extra = {}) => request(app).post('/api/v1/registrations').set('Cookie', auth.cookie).set('X-CSRF-Token', auth.token).send({ programId, ...extra });
  const cancel = (id,body={})=>request(app).post('/api/v1/registrations/'+id+'/cancel').set('Cookie',cookie).set('X-CSRF-Token',token).send(body);
  const list = query=>request(app).get('/api/v1/registrations'+(query?'?'+query:'')).set('Cookie',cookie);
  test('own list returns exactly 12 fields with bounded pagination and status filters',async()=>{
    await register().expect(201);
    const result=await list().expect(200);expect(Object.keys(result.body.items[0])).toHaveLength(12);
    expect(result.body.items[0]).toMatchObject({programId:open,status:'REGISTERED',cancelledAt:null,cancellationReason:null});
    expect(JSON.stringify(result.body)).not.toMatch(/fixture-nric|PARTICIPANT@example.test|cancellationEligible/);
    expect((await list('status=CANCELLED').expect(200)).body.items).toEqual([]);
    expect((await list('page=2&pageSize=1').expect(200)).body).toMatchObject({items:[],total:1});
  });
  test('cancellation retains history, releases seats/key, adds audit and no notification',async()=>{
    const created=await register().expect(201);const result=await cancel(created.body.registrationId,{cancellationReason:'Changed plans'}).expect(200);
    expect(Object.keys(result.body).sort()).toEqual(['registrationId','referenceNo','status','cancelledAt'].sort());
    const [rows]=await admin.query('SELECT * FROM registrations');expect(rows).toHaveLength(1);expect(rows[0].status).toBe('CANCELLED');expect(rows[0].active_registration_key).toBeNull();expect(rows[0].cancellation_reason).toBe('Changed plans');
    const [events]=await admin.query("SELECT * FROM audit_records WHERE action='REGISTRATION_CANCELLED'");expect(events).toHaveLength(1);expect(events[0].actor_role).toBe('PARTICIPANT');
    expect((await admin.query('SELECT * FROM notification_outbox'))[0]).toHaveLength(1);
    expect((await request(app).get('/api/v1/programs/'+open).expect(200)).body.availableSeats).toBe(2);
    await register().expect(201);
    const history=await list('sort=REGISTERED_AT_ASC').expect(200);expect(history.body.total).toBe(2);
  });
  test('concurrent duplicate cancellations return one 200 and one 400 with one audit',async()=>{
    const created=await register().expect(201);const results=await Promise.all([cancel(created.body.registrationId),cancel(created.body.registrationId)]);
    expect(results.map(r=>r.status).sort()).toEqual([200,400]);
    expect((await admin.query("SELECT * FROM audit_records WHERE action='REGISTRATION_CANCELLED'"))[0]).toHaveLength(1);
  });
  test('cancellation/re-registration race preserves one active registration and capacity',async()=>{
    const created=await register(full).expect(201);const results=await Promise.all([cancel(created.body.registrationId),register(full)]);
    expect(results[0].status).toBe(200);expect([201,409]).toContain(results[1].status);
    if(results[1].status===409)await register(full).expect(201);
    expect((await admin.query("SELECT * FROM registrations WHERE status='REGISTERED'"))[0]).toHaveLength(1);
  });
  test('foreign ownership is 403, own list excludes foreign rows and missing registration is 404',async()=>{
    const [u]=await admin.query("INSERT INTO users (account_identifier,username,name,email,password_hash,role_id,role_name,permissions,access_scope,permitted_responsibilities,account_status,role_assigned_at,authentication_method,created_at,updated_at) VALUES ('A-other','other','Other','other@example.test','hash','PARTICIPANT','PARTICIPANT','[]','[]','[]','ACTIVE',UTC_TIMESTAMP(),'PASSWORD',UTC_TIMESTAMP(),UTC_TIMESTAMP())");
    const [p]=await admin.execute("INSERT INTO participants (user_id,nric_passport_no,name,mobile_no,created_at,updated_at) VALUES (?,'other-nric','Other','0123',UTC_TIMESTAMP(),UTC_TIMESTAMP())",[u.insertId]);
    const auth=await sessionFor(p.insertId);const created=await register(open,auth).expect(201);
    await cancel(created.body.registrationId).expect(403);await cancel(999999).expect(404);expect((await list().expect(200)).body.items).toEqual([]);
  });
  test('at/after start and already-cancelled records return 400',async()=>{
    const created=await register().expect(201);
    await admin.execute("UPDATE training_programs SET training_date=UTC_DATE(),start_time='00:00:00',end_time='01:00:00' WHERE program_id=?",[open]);await cancel(created.body.registrationId).expect(400);
    await admin.execute("UPDATE training_programs SET training_date='2026-12-01' WHERE program_id=?",[open]);await cancel(created.body.registrationId).expect(200);await cancel(created.body.registrationId).expect(400);
  });
  test('audit failure rolls back cancellation and preserves active key',async()=>{
    const created=await register().expect(201);
    await admin.query("CREATE TRIGGER wf010_audit_failure BEFORE INSERT ON audit_records FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Injected failure'");
    try{await cancel(created.body.registrationId).expect(500);const [rows]=await admin.query('SELECT status,active_registration_key FROM registrations');expect(rows[0].status).toBe('REGISTERED');expect(rows[0].active_registration_key).not.toBeNull();}
    finally{await admin.query('DROP TRIGGER wf010_audit_failure');}
  });
  test('optional reason accepts 500 characters, rejects overflow/identity injection and no reason becomes null',async()=>{
    const created=await register().expect(201);await cancel(created.body.registrationId,{cancellationReason:'x'.repeat(501)}).expect(400);
    await cancel(created.body.registrationId,{participantId:participantId}).expect(400);
    await cancel(created.body.registrationId,{cancellationReason:'x'.repeat(500)}).expect(200);
    const second=await register().expect(201);await cancel(second.body.registrationId).expect(200);
    expect((await list('status=CANCELLED').expect(200)).body.items.some(row=>row.cancellationReason===null)).toBe(true);
  });
  test('session/CSRF/invalid filter controls protect both page and API',async()=>{
    await request(app).get('/registrations').expect(401);await request(app).get('/api/v1/registrations').expect(401);
    const created=await register().expect(201);await request(app).post('/api/v1/registrations/'+created.body.registrationId+'/cancel').set('Cookie',cookie).send({}).expect(403);
    for(const query of ['participantId=1','email=secret','status=OPEN','sort=DROP%20TABLE','page=1&page=2','pageSize=101'])await list(query).expect(400);
    await admin.query('UPDATE sessions SET expires_at=UTC_TIMESTAMP()-INTERVAL 1 MINUTE');await cancel(created.body.registrationId).expect(401);
  });
  test('page is protected and delivers configured controls/CSRF/timezone without identity input',async()=>{
    const result=await request(app).get('/registrations').set('Cookie',cookie).expect(200);expect(result.text).toContain('My Registrations');expect(result.text).toContain(token);expect(result.text).toContain('maxlength="500"');expect(result.headers['cache-control']).toBe('no-store');
    await request(app).get('/js/my-registrations.js').expect(200);await request(app).get('/js/business-time.js').expect(200);
  });
});
