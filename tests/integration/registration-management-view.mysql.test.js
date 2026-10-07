const mysql = require('../../src/node_modules/mysql2/promise');
const request = require('../../src/node_modules/supertest');
const fs = require('fs');
const path = require('path');
const enabled = process.env.WF012_TEST_DB_PORT && process.env.WF012_TEST_DB_NAME;
(enabled ? describe : describe.skip)('WF-012 isolated MySQL registration management', () => {
  let admin, pool, app, trainerId, participantId, active, other, inactive, open, full, closed, sessions, cookie, token, managerId, systemAdminId;
  const database = process.env.WF012_TEST_DB_NAME;
  const saved = { ...process.env };
  beforeAll(async () => {
    if (!/^tms_wf012_[a-z0-9_]+_test$/.test(database)) throw new Error('Fresh dedicated WF-012 test database required.');
    admin = await mysql.createConnection({ host: process.env.WF012_TEST_DB_HOST || '127.0.0.1', port: Number(process.env.WF012_TEST_DB_PORT),
      user: process.env.WF012_TEST_DB_USER || 'root', password: process.env.WF012_TEST_DB_PASSWORD, multipleStatements: true });
    await admin.query(`CREATE DATABASE \`${database}\``);
    await admin.query(`USE \`${database}\``);
    for (const file of ['v1.0_participant-account-schema.sql', 'v1.1_participant-authentication-schema.sql', 'v1.2_program-catalogue-schema.sql', 'v1.3_registration-notification-outbox.sql']) {
      await admin.query(fs.readFileSync(path.join(__dirname, '../../db/migrations', file), 'utf8'));
    }
    Object.assign(process.env, { DB_HOST: process.env.WF012_TEST_DB_HOST || '127.0.0.1', DB_PORT: process.env.WF012_TEST_DB_PORT,
      DB_USER: process.env.WF012_TEST_DB_USER || 'root', DB_PASSWORD: process.env.WF012_TEST_DB_PASSWORD, DB_NAME: database, SESSION_SECRET: 'isolated-registration-secret-'.repeat(3), SESSION_COOKIE_SECURE: 'false' });
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

  async function managerSession(userId=managerId,role='TRAINING_ADMINISTRATOR') {
    const connection=await pool.getConnection();
    try {const prepared=await sessions.prepare({connection,now:new Date(),preparedSessionIds:[]},{},{userId:String(userId),role});
      const cookie='tms.sid='+prepared.cookiePlan.value;return {cookie,token:(await sessions.load({headers:{cookie}})).csrfToken};
    }finally{connection.release();}
  }

  const list=query=>request(app).get('/api/v1/admin/registrations'+(query?'?'+query:'')).set('Cookie',cookie);
  const detail=id=>request(app).get('/api/v1/admin/registrations/'+id).set('Cookie',cookie);
  async function seed(){
    await registration(open,'R-open');await registration(full,'R-full','CANCELLED');await registration(closed,'R-closed');
    await admin.query("UPDATE registrations SET registered_at='2026-10-07 01:00:00',registration_remarks='Detail <script> only'");
    await admin.query("UPDATE registrations SET registered_at='2026-10-07 02:00:00',cancelled_at='2026-10-07 03:00:00',cancellation_reason='Changed <script> plans' WHERE status='CANCELLED'");
    return (await admin.query('SELECT registration_id FROM registrations ORDER BY registration_id'))[0].map(row=>row.registration_id);
  }
  test('exact list/detail DTOs with remarks only in detail and no PII',async()=>{
    const ids=await seed();const result=await list().expect(200);expect(Object.keys(result.body).sort()).toEqual(['items','page','pageSize','total']);expect(result.body.total).toBe(3);
    expect(result.body.items.every(item=>Object.keys(item).length===8)).toBe(true);
    const selected=await detail(ids[0]).expect(200);expect(Object.keys(selected.body)).toHaveLength(9);expect(selected.body.registrationRemarks).toBe('Detail <script> only');expect(selected.body.registeredAt).toBe('2026-10-07T01:00:00.000Z');
    expect(JSON.stringify(result.body)).not.toMatch(/fixture-nric|example.test|remarks|password|session/i);
    expect((await detail(ids[1]).expect(200)).body).toMatchObject({status:'CANCELLED',cancelledAt:'2026-10-07T03:00:00.000Z',cancellationReason:'Changed <script> plans'});
    await detail(999999).expect(404);
  });
  test('filter predicates match total, use all categories and preserve cancelled history',async()=>{
    await seed();expect((await list('programId='+open).expect(200)).body.total).toBe(1);
    expect((await list('categoryId='+other+'&status=CANCELLED').expect(200)).body.total).toBe(1);
    expect((await list('participantId='+participantId).expect(200)).body.total).toBe(3);
    expect((await list('categoryId='+inactive).expect(200)).body.items).toEqual([]);
    expect((await list('categoryId='+other+'&status=REGISTERED').expect(200)).body.total).toBe(0);
    await registration(await program('new-hidden','DRAFT',inactive),'R-hidden');expect((await list('categoryId='+inactive).expect(200)).body.total).toBe(1);
  });
  test('inclusive/exclusive UTC periods, offsets and deterministic pagination',async()=>{
    const ids=await seed();let result=await list('periodFrom=2026-10-07T01:00:00Z&periodTo=2026-10-07T02:00:00Z').expect(200);expect(result.body.total).toBe(2);
    result=await list('periodFrom='+encodeURIComponent('2026-10-07T10:00:00+08:00')).expect(200);expect(result.body.total).toBe(1);
    result=await list('sort=REGISTERED_AT_ASC&pageSize=1&page=2').expect(200);expect(result.body.items[0].registrationId).toBe(ids[2]);expect(result.body.total).toBe(3);
    expect((await list('page=5&pageSize=1').expect(200)).body.items).toEqual([]);
    for(const sort of ['REGISTERED_AT_DESC','REGISTERED_AT_ASC','DATE_ASC','DATE_DESC'])await list('sort='+sort).expect(200);
  });
  test.each(['pageSize=101','page=0','programId=9007199254740992','categoryId=1.2','participantId=01','status=APPROVED','sort=r.registered_at','programId=1&programId=2','role=TRAINING_ADMINISTRATOR','periodFrom=2026-02-30T00:00:00Z','periodFrom=2026-10-07T02:00:00Z&periodTo=2026-10-07T01:00:00Z'])('strict query validation %s',async query=>{await list(query).expect(400);});
  test('anonymous and other roles denied by page/list/detail',async()=>{
    const ids=await seed();await request(app).get('/api/v1/admin/registrations').expect(401);await request(app).get('/admin/registrations').expect(401);
    for(const auth of [await sessionFor(participantId),await managerSession(trainerId,'TRAINER'),await managerSession(systemAdminId,'SYSTEM_ADMINISTRATOR')]){
      await request(app).get('/api/v1/admin/registrations').set('Cookie',auth.cookie).expect(403);await request(app).get('/api/v1/admin/registrations/'+ids[0]).set('Cookie',auth.cookie).expect(403);await request(app).get('/admin/registrations').set('Cookie',auth.cookie).expect(403);
    }
  });
  test('live missing permission or scope denies list/detail/page',async()=>{
    const ids=await seed();
    for(const column of ['permissions','access_scope']){
      await admin.query('UPDATE users SET '+column+"='[]' WHERE user_id="+managerId);
      try {await list().expect(403);await detail(ids[0]).expect(403);await request(app).get('/admin/registrations').set('Cookie',cookie).expect(403);}
      finally{await admin.execute("UPDATE users SET permissions='[\"REGISTRATION_READ\"]', access_scope='[\"ALL_TRAINING_OPERATIONS\"]' WHERE user_id=?",[managerId]);}
    }
  });
  test('count and rows share one repeatable-read snapshot',async()=>{
    await seed();const original=pool.getConnection.bind(pool);let inserted=false;
    pool.getConnection=async()=>{const connection=await original(),execute=connection.execute.bind(connection);
      connection.execute=async(sql,values)=>{const result=await execute(sql,values);
        if(sql.startsWith('SELECT COUNT(*) AS total')&&!inserted){inserted=true;await registration(open,'R-concurrent-snapshot','CANCELLED');}
        return result;
      };return connection;
    };
    try {const result=await list().expect(200);expect(inserted).toBe(true);expect(result.body.total).toBe(3);expect(result.body.items).toHaveLength(3);}
    finally{pool.getConnection=original;}
    expect((await list().expect(200)).body.total).toBe(4);
  });
  test('no registration writes, read audits or outbox events; no mutation routes',async()=>{
    const ids=await seed(),before=(await admin.query('SELECT * FROM registrations ORDER BY registration_id'))[0];
    await list().expect(200);await detail(ids[0]).expect(200);
    expect((await admin.query('SELECT * FROM registrations ORDER BY registration_id'))[0]).toEqual(before);expect((await admin.query('SELECT * FROM audit_records'))[0]).toEqual([]);expect((await admin.query('SELECT * FROM notification_outbox'))[0]).toEqual([]);
    for(const method of ['post','put','delete'])await request(app)[method]('/api/v1/admin/registrations/'+ids[0]).set('Cookie',cookie).send({status:'CANCELLED'}).expect(404);
  });
  test('page has exact read-only controls and business-time assets; navigation linked',async()=>{
    const page=await request(app).get('/admin/registrations').set('Cookie',cookie).expect(200);expect(page.headers['cache-control']).toBe('no-store');expect(page.text).toContain('Student ID');expect(page.text).toContain('/js/registration-management.js');expect(page.text).not.toContain('Cancel registration');
    const programs=await request(app).get('/admin/programs').set('Cookie',cookie).expect(200);expect(programs.text).toContain('/admin/registrations');
  });
});
