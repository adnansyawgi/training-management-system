const mysql = require('../../src/node_modules/mysql2/promise');
const request = require('../../src/node_modules/supertest');
const fs = require('fs');
const path = require('path');
const { makeCatalogueRepository } = require('../../src/repositories/program-catalogue.repository');
const enabled = process.env.WF009_TEST_DB_PORT && process.env.WF009_TEST_DB_NAME;
(enabled ? describe : describe.skip)('WF-009 isolated MySQL catalogue', () => {
  let admin, pool, app, trainerId, participantId, active, other, inactive, open, full, closed, sessions, cookie, token;
  const database = process.env.WF009_TEST_DB_NAME;
  const saved = { ...process.env };
  beforeAll(async () => {
    if (!/^tms_wf009_[a-z0-9_]+_test$/.test(database)) throw new Error('Fresh dedicated WF-009 test database required.');
    admin = await mysql.createConnection({ host: process.env.WF009_TEST_DB_HOST || '127.0.0.1', port: Number(process.env.WF009_TEST_DB_PORT),
      user: process.env.WF009_TEST_DB_USER || 'root', password: process.env.WF009_TEST_DB_PASSWORD, multipleStatements: true });
    await admin.query(`CREATE DATABASE \`${database}\``);
    await admin.query(`USE \`${database}\``);
    for (const file of ['v1.0_participant-account-schema.sql', 'v1.1_participant-authentication-schema.sql', 'v1.2_program-catalogue-schema.sql', 'v1.3_registration-notification-outbox.sql']) {
      await admin.query(fs.readFileSync(path.join(__dirname, '../../db/migrations', file), 'utf8'));
    }
    Object.assign(process.env, { DB_HOST: process.env.WF009_TEST_DB_HOST || '127.0.0.1', DB_PORT: process.env.WF009_TEST_DB_PORT,
      DB_USER: process.env.WF009_TEST_DB_USER || 'root', DB_PASSWORD: process.env.WF009_TEST_DB_PASSWORD, DB_NAME: database, SESSION_SECRET: 'isolated-registration-secret-'.repeat(3), SESSION_COOKIE_SECURE: 'false' });
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
  test('registration commits exactly one account-owned registration, audit and minimal outbox', async () => {
    const result = await register().expect(201);
    expect(Object.keys(result.body).sort()).toEqual(['registrationId','referenceNo','programId','status','registeredAt'].sort());
    expect(result.body.referenceNo).toMatch(/^R-[0-9A-HJKMNP-TV-Z]{26}$/);
    const [rows] = await admin.query('SELECT * FROM registrations'); expect(rows).toHaveLength(1); expect(rows[0].participant_id).toBe(participantId);
    const [audit] = await admin.query('SELECT * FROM audit_records'); expect(audit).toHaveLength(1); expect(audit[0].action).toBe('REGISTRATION_CREATED');
    const [outbox] = await admin.query('SELECT * FROM notification_outbox'); expect(outbox).toHaveLength(1); expect(outbox[0].status).toBe('PENDING');
    expect(outbox[0].recipient).toBe('PARTICIPANT@example.test'); expect(JSON.stringify(outbox)).not.toMatch(/fixture-nric|fixture-hash/);
  });
  test('concurrent duplicate requests commit one registration/audit/outbox', async () => {
    const results = await Promise.all([register(), register()]); expect(results.map(r => r.status).sort()).toEqual([201,409]);
    const [rows] = await admin.query('SELECT COUNT(*) AS count FROM notification_outbox'); expect(Number(rows[0].count)).toBe(1);
  });
  test('two participants competing for the final seat cannot both commit', async () => {
    const [u] = await admin.query("INSERT INTO users (account_identifier,username,name,email,password_hash,role_id,role_name,permissions,access_scope,permitted_responsibilities,account_status,role_assigned_at,authentication_method,created_at,updated_at) VALUES ('A-second','second','Second','second@example.test','hash','PARTICIPANT','PARTICIPANT','[]','[]','[]','ACTIVE',UTC_TIMESTAMP(),'PASSWORD',UTC_TIMESTAMP(),UTC_TIMESTAMP())");
    const [p] = await admin.execute("INSERT INTO participants (user_id,nric_passport_no,name,mobile_no,created_at,updated_at) VALUES (?,'second-nric','Second','0123',UTC_TIMESTAMP(),UTC_TIMESTAMP())", [u.insertId]);
    const second = await sessionFor(p.insertId);
    const results = await Promise.all([register(full), register(full, second)]); expect(results.map(r => r.status).sort()).toEqual([201,409]);
    expect((await request(app).get('/api/v1/programs/' + full).expect(200)).body.availableSeats).toBe(0);
  });
  test('concurrent same-participant overlap serializes and only one commits', async () => {
    const otherProgram = await program('Overlap', 'OPEN');
    const results = await Promise.all([register(open), register(otherProgram)]); expect(results.map(r => r.status).sort()).toEqual([201,409]);
  });
  test('adjacent schedules do not overlap and cancelled history permits re-registration', async () => {
    await register().expect(201);
    await admin.query("UPDATE registrations SET status='CANCELLED',cancelled_at=UTC_TIMESTAMP()");
    await register().expect(201);
    const adjacent = await program('Adjacent', 'OPEN'); await admin.execute("UPDATE training_programs SET start_time='10:00:00',end_time='11:00:00' WHERE program_id=?", [adjacent]);
    await register(adjacent).expect(201);
  });
  test.each(['audit_records','notification_outbox','registrations'])('%s failure rolls back all mandatory writes', async table => {
    await admin.query(`CREATE TRIGGER wf009_failure BEFORE INSERT ON ${table} FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Injected failure'`);
    try {
      await register().expect(500);
      const [rows] = await admin.query('SELECT (SELECT COUNT(*) FROM registrations) AS registrations,(SELECT COUNT(*) FROM audit_records) AS audits,(SELECT COUNT(*) FROM notification_outbox) AS notifications');
      expect(rows[0]).toEqual({ registrations: 0, audits: 0, notifications: 0 });
    } finally { await admin.query('DROP TRIGGER wf009_failure'); }
  });
  test.each(['future','expired','closed','full'])('%s rejects with 409', async reason => {
    if (reason==='future') await admin.execute('UPDATE training_programs SET registration_open_at=UTC_TIMESTAMP()+INTERVAL 1 DAY,registration_close_at=UTC_TIMESTAMP()+INTERVAL 2 DAY WHERE program_id=?',[open]);
    if (reason==='expired') await admin.execute('UPDATE training_programs SET registration_open_at=UTC_TIMESTAMP()-INTERVAL 2 DAY,registration_close_at=UTC_TIMESTAMP()-INTERVAL 1 DAY WHERE program_id=?',[open]);
    if (reason==='closed') await admin.execute("UPDATE training_programs SET status='CLOSED' WHERE program_id=?",[open]);
    if (reason==='full') { await admin.execute('UPDATE training_programs SET capacity=1 WHERE program_id=?',[open]); await registration(open,'fixture-full'); }
    await register().expect(409);
  });
  test('invisible and unknown programs return 404', async () => {
    await admin.execute("UPDATE training_programs SET status='DRAFT' WHERE program_id=?",[open]); await register().expect(404); await register(999999).expect(404);
  });
  test('anonymous/expired sessions and client identity injection are rejected', async () => {
    await request(app).post('/api/v1/registrations').send({ programId: open }).expect(401);
    await register(open, {cookie,token}, {participantId: 99}).expect(400);
    await admin.query('UPDATE sessions SET expires_at=UTC_TIMESTAMP()-INTERVAL 1 MINUTE'); await register().expect(401);
  });
  test('CSRF rejection is audited without creating registration or outbox', async () => {
    await register(open,{cookie,token:'bad'}).expect(403);
    const [rows] = await admin.query("SELECT action,access_scope FROM audit_records"); expect(rows[0]).toEqual({action:'CSRF_REJECTED',access_scope:'PARTICIPANT'});
    const [registrations] = await admin.query('SELECT * FROM registrations'); expect(registrations).toHaveLength(0);
  });
  test('confirmation masks NRIC and uses session-derived profile and CSRF token', async () => {
    const result = await request(app).get('/programs/' + open + '/register').set('Cookie',cookie).expect(200);
    expect(result.text).not.toContain('fixture-nric'); expect(result.text).toContain('nric');
    expect(result.text).toContain('PARTICIPANT@example.test'); expect(result.text).toContain(token); expect(result.headers['cache-control']).toBe('no-store');
  });
  test('concurrent worker claims deliver one committed notification once', async () => {
    await register().expect(201);
    const { makeNotificationRepository } = require('../../src/repositories/registration-notification.repository');
    const { makeNotificationWorker } = require('../../src/jobs/notification-worker');
    const mail = { send: jest.fn().mockResolvedValue() };
    const repository = makeNotificationRepository({ pool });
    // DATETIME(0) can round the committed due time up to the next second.
    const now = () => new Date(Date.now() + 2000);
    const workers = [makeNotificationWorker({ repository, mail, now }), makeNotificationWorker({ repository, mail, now })];
    await Promise.all(workers.map(worker => worker.runOnce()));
    expect(mail.send).toHaveBeenCalledTimes(1);
    expect((await admin.query('SELECT status FROM notification_outbox'))[0][0].status).toBe('SENT');
  });
  test('transaction rechecks a session that expires after request authentication', async () => {
    const bindings = require('../../src/participant-program-registration.bindings');
    const original = bindings.repository.lockParticipant;
    bindings.repository.lockParticipant = async (connection, context) => {
      await admin.query('UPDATE sessions SET expires_at=UTC_TIMESTAMP()-INTERVAL 1 MINUTE');
      return original(connection, context);
    };
    try {
      await register().expect(401);
      expect((await admin.query('SELECT * FROM registrations'))[0]).toHaveLength(0);
    } finally { bindings.repository.lockParticipant = original; }
  });
  test('outbox worker retries safely, can recover expired leases, and preserves committed registration', async () => {
    await register().expect(201);
    const { makeNotificationRepository } = require('../../src/repositories/registration-notification.repository');
    const { makeNotificationWorker } = require('../../src/jobs/notification-worker');
    const repository = makeNotificationRepository({pool}); let now = new Date(Date.now() + 2000);
    const mail = {send: jest.fn().mockRejectedValue(new Error('SMTP password secret'))};
    const worker = makeNotificationWorker({repository,mail,now:()=>now});
    for (let i=0;i<4;i++) { await worker.runOnce(); now = new Date(now.getTime()+5*60000); }
    const [rows] = await admin.query('SELECT * FROM notification_outbox'); expect(rows[0].status).toBe('FAILED'); expect(rows[0].attempt_count).toBe(4); expect(rows[0].last_error).toBe('SMTP_DELIVERY_FAILED');
    expect((await admin.query('SELECT * FROM registrations'))[0]).toHaveLength(1);
    await admin.query("UPDATE notification_outbox SET status='PROCESSING',attempt_count=1,updated_at=UTC_TIMESTAMP()-INTERVAL 2 MINUTE");
    mail.send.mockResolvedValue(); await worker.runOnce(); expect((await admin.query('SELECT status FROM notification_outbox'))[0][0].status).toBe('SENT');
  });
});
