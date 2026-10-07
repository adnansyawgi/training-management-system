const mysql = require('../../src/node_modules/mysql2/promise');
const request = require('../../src/node_modules/supertest');
const fs = require('fs');
const path = require('path');
const { makeCatalogueRepository } = require('../../src/repositories/program-catalogue.repository');
const enabled = process.env.WF011_TEST_DB_PORT && process.env.WF011_TEST_DB_NAME;
(enabled ? describe : describe.skip)('WF-011 isolated MySQL catalogue', () => {
  let admin, pool, app, trainerId, participantId, active, other, inactive, open, full, closed, sessions, cookie, token, managerId;
  const database = process.env.WF011_TEST_DB_NAME;
  const saved = { ...process.env };
  beforeAll(async () => {
    if (!/^tms_wf011_[a-z0-9_]+_test$/.test(database)) throw new Error('Fresh dedicated WF-011 test database required.');
    admin = await mysql.createConnection({ host: process.env.WF011_TEST_DB_HOST || '127.0.0.1', port: Number(process.env.WF011_TEST_DB_PORT),
      user: process.env.WF011_TEST_DB_USER || 'root', password: process.env.WF011_TEST_DB_PASSWORD, multipleStatements: true });
    await admin.query(`CREATE DATABASE \`${database}\``);
    await admin.query(`USE \`${database}\``);
    for (const file of ['v1.0_participant-account-schema.sql', 'v1.1_participant-authentication-schema.sql', 'v1.2_program-catalogue-schema.sql', 'v1.3_registration-notification-outbox.sql']) {
      await admin.query(fs.readFileSync(path.join(__dirname, '../../db/migrations', file), 'utf8'));
    }
    Object.assign(process.env, { DB_HOST: process.env.WF011_TEST_DB_HOST || '127.0.0.1', DB_PORT: process.env.WF011_TEST_DB_PORT,
      DB_USER: process.env.WF011_TEST_DB_USER || 'root', DB_PASSWORD: process.env.WF011_TEST_DB_PASSWORD, DB_NAME: database, SESSION_SECRET: 'isolated-registration-secret-'.repeat(3), SESSION_COOKIE_SECURE: 'false' });
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
    trainerId = await createUser('TRAINER'); managerId = await createUser('TRAINING_ADMINISTRATOR');
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
  const register = (programId = open, auth = { cookie, token }, extra = {}) => request(app).post('/api/v1/registrations').set('Cookie', auth.cookie).set('X-CSRF-Token', auth.token).send({ programId, ...extra });
  const cancel = (id,body={})=>request(app).post('/api/v1/registrations/'+id+'/cancel').set('Cookie',cookie).set('X-CSRF-Token',token).send(body);
  const list = query=>request(app).get('/api/v1/registrations'+(query?'?'+query:'')).set('Cookie',cookie);

  async function managerSession(userId=managerId,role='TRAINING_ADMINISTRATOR') {
    const connection=await pool.getConnection();
    try {const prepared=await sessions.prepare({connection,now:new Date(),preparedSessionIds:[]},{},{userId:String(userId),role});
      const cookie='tms.sid='+prepared.cookiePlan.value;return {cookie,token:(await sessions.load({headers:{cookie}})).csrfToken};
    }finally{connection.release();}
  }
  const payload=()=>({code:'NEW',name:'New program',description:'Description',objectives:'Objectives',targetAudience:'Audience',categoryId:active,trainerUserId:trainerId,trainingDate:'2026-12-02',startTime:'09:00:00',endTime:'10:00:00',deliveryMode:'ONLINE',registrationOpenAt:'2026-10-01T00:00:00Z',registrationCloseAt:'2026-11-30T00:00:00Z',status:'DRAFT',certificateEligibilityCriteria:'ATTENDANCE'});
  const write=(kind,body,id)=>request(app)[id?'put':'post']('/api/v1/admin/'+kind+(id?'/'+id:'')).set('Cookie',cookie).set('X-CSRF-Token',token).send(body);
  test('program default capacity, exact projection, audit and immutable code',async()=>{
    const result=await write('programs',payload()).expect(201);expect(Object.keys(result.body.program)).toHaveLength(26);expect(result.body.program.capacity).toBe(20);
    await write('programs',payload()).expect(409);
    const [events]=await admin.query("SELECT * FROM audit_records WHERE action='PROGRAM_CREATED'");expect(events).toHaveLength(1);expect(events[0].access_scope).toBe('ALL_TRAINING_OPERATIONS');
    const body={...payload(),capacity:37,status:'OPEN'};delete body.code;
    expect((await write('programs',body,result.body.program.programId).expect(200)).body.program.capacity).toBe(37);
    await write('programs',{...body,code:'change'},result.body.program.programId).expect(400);
  });
  test('category defaults, exact create/update fields and duplicate conflict',async()=>{
    const result=await write('categories',{name:'New category'}).expect(201);expect(Object.keys(result.body)).toHaveLength(6);expect(result.body.status).toBe('ACTIVE');
    const updated=await write('categories',{name:'Renamed',status:'INACTIVE'},result.body.categoryId).expect(200);expect(Object.keys(updated.body)).toHaveLength(5);
    await write('categories',{name:'Renamed'}).expect(409);await write('categories',{name:'Missing',status:'ACTIVE'},999999).expect(404);
  });
  test.each([{capacity:0},{capacity:null},{code:'x',name:''},{unexpected:true},{trainingDate:'2026-02-30'},{trainerUserId:999999},{categoryId:999999},{endTime:'08:00:00'},{registrationCloseAt:'2027-01-01T00:00:00Z'}])('invalid program rejected: %j',async change=>{
    await write('programs',{...payload(),...change}).expect(400);
  });
  test('trainer and venue overlaps rejected; adjacent slots allowed',async()=>{
    await write('programs',{...payload(),trainingDate:'2026-12-01'}).expect(400);
    await write('programs',{...payload(),trainingDate:'2026-12-01',startTime:'10:00:00',endTime:'11:00:00'}).expect(201);
  });
  test('lifecycle rejects backward transitions and terminal reopening',async()=>{
    const result=await write('programs',payload()).expect(201);const id=result.body.program.programId;const body={...payload(),capacity:20};delete body.code;
    await write('programs',{...body,status:'OPEN'},id).expect(200);await write('programs',body,id).expect(400);
    await write('programs',{...body,status:'CANCELLED'},id).expect(200);await write('programs',{...body,status:'OPEN'},id).expect(400);
  });
  test('capacity cannot fall below active registrations',async()=>{
    await registration(open,'capacity-one');
    await admin.execute("INSERT INTO users (account_identifier,username,name,email,password_hash,role_id,role_name,permissions,access_scope,permitted_responsibilities,account_status,role_assigned_at,created_at,updated_at) SELECT 'A-second','second','Second','second@example.test',password_hash,role_id,role_name,permissions,access_scope,permitted_responsibilities,account_status,role_assigned_at,created_at,updated_at FROM users WHERE role_id='PARTICIPANT'");
    const [users]=await admin.query("SELECT user_id FROM users WHERE username='second'");
    const [profile]=await admin.execute("INSERT INTO participants (user_id,nric_passport_no,name,mobile_no,created_at,updated_at) VALUES (?,'second','Second','0123',UTC_TIMESTAMP(),UTC_TIMESTAMP())",[users[0].user_id]);
    await admin.execute("INSERT INTO registrations (reference_no,participant_id,program_id,registered_at,status,created_at,updated_at) VALUES ('capacity-two',?,?,UTC_TIMESTAMP(),'REGISTERED',UTC_TIMESTAMP(),UTC_TIMESTAMP())",[profile.insertId,open]);
    const body={...payload(),trainingDate:'2026-12-01',capacity:1,status:'OPEN'};delete body.code;
    await write('programs',body,open).expect(400);
  });
  test('participant reschedule overlap rejected independently of trainer and venue',async()=>{
    const [secondTrainer]=await admin.execute("INSERT INTO users (account_identifier,username,name,email,password_hash,role_id,role_name,permissions,access_scope,permitted_responsibilities,account_status,role_assigned_at,created_at,updated_at) SELECT 'A-trainer-second','trainer-second','Second trainer','trainer-second@example.test',password_hash,role_id,role_name,permissions,access_scope,permitted_responsibilities,account_status,role_assigned_at,created_at,updated_at FROM users WHERE user_id=?",[trainerId]);
    await admin.execute('UPDATE training_programs SET trainer_user_id=? WHERE program_id=?',[secondTrainer.insertId,full]);
    await registration(open,'participant-original');await registration(full,'participant-other');
    await admin.execute("UPDATE training_programs SET training_date='2026-12-03' WHERE program_id=?",[full]);
    const body={...payload(),trainingDate:'2026-12-03',capacity:20,status:'OPEN'};delete body.code;
    await write('programs',body,open).expect(400);
    expect((await admin.execute("SELECT DATE_FORMAT(training_date,'%Y-%m-%d') AS training_date FROM training_programs WHERE program_id=?",[open]))[0][0].training_date).toBe('2026-12-01');
  });
  test('other live roles denied and a disabled administrator cannot write',async()=>{
    const trainerAuth=await managerSession(trainerId,'TRAINER');await request(app).post('/api/v1/admin/categories').set('Cookie',trainerAuth.cookie).set('X-CSRF-Token',trainerAuth.token).send({name:'Denied'}).expect(403);
    const auth=await sessionFor(participantId);
    await request(app).post('/api/v1/admin/categories').set('Cookie',auth.cookie).set('X-CSRF-Token',auth.token).send({name:'Denied'}).expect(403);
    await admin.execute("UPDATE users SET account_status='DISABLED' WHERE user_id=?",[managerId]);
    try {await write('categories',{name:'Denied'}).expect(401);}finally{await admin.execute("UPDATE users SET account_status='ACTIVE' WHERE user_id=?",[managerId]);}
  });
  test('concurrent overlapping program creates serialize to one success',async()=>{
    const results=await Promise.all([write('programs',payload()),write('programs',{...payload(),code:'SECOND'})]);
    expect(results.map(r=>r.status).sort()).toEqual([201,400]);
    expect((await admin.query("SELECT * FROM audit_records WHERE action='PROGRAM_CREATED'"))[0]).toHaveLength(1);
  });
  test('audit failure rolls back category and program',async()=>{
    await admin.query("CREATE TRIGGER wf011_fail_audit BEFORE INSERT ON audit_records FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture audit failure'");
    try {await write('programs',payload()).expect(500);await write('categories',{name:'Rolled back'}).expect(500);
      expect((await admin.query("SELECT * FROM training_programs WHERE code='NEW'"))[0]).toHaveLength(0);expect((await admin.query("SELECT * FROM program_categories WHERE name='Rolled back'"))[0]).toHaveLength(0);
    }finally{await admin.query('DROP TRIGGER wf011_fail_audit');}
  });
  test('authentication, csrf, pages escaping and bounded queries',async()=>{
    await request(app).post('/api/v1/admin/categories').send({name:'Denied'}).expect(401);
    await request(app).post('/api/v1/admin/categories').set('Cookie',cookie).send({name:'Denied'}).expect(403);
    const page=await request(app).get('/admin/programs').set('Cookie',cookie).expect(200);expect(page.text).toContain('Active &lt;script&gt;');expect(page.text).not.toContain('Active <script>');
    await request(app).get('/admin/categories').set('Cookie',cookie).expect(200);
    await request(app).get('/admin/programs?pageSize=101').set('Cookie',cookie).expect(400);
    await request(app).get('/admin/programs?edit='+open).set('Cookie',cookie).expect(200);
    await request(app).get('/api/v1/admin/programs').set('Cookie',cookie).expect(404);
  });
});
