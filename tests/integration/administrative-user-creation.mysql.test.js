const mysql = require('../../src/node_modules/mysql2/promise');
const request = require('../../src/node_modules/supertest');
const fs = require('fs');
const path = require('path');
const enabled = process.env.WF005_TEST_DB_PORT && process.env.WF005_TEST_DB_NAME;
(enabled ? describe : describe.skip)('WF-005 isolated MySQL user creation', () => {
  let admin, pool, app, cookie, csrf;
  const database = process.env.WF005_TEST_DB_NAME;
  const saved = { ...process.env };
  const administrator = { staticAdministrationKey: 'isolated-bootstrap-key', username: 'admin', name: 'Admin', email: 'admin@example.test', password: 'StrongPassword@123' };
  const input = { username: 'entered-staff', name: 'Staff', email: 'staff@example.test', password: 'StrongPassword@123', role: 'TRAINER' };
  const create = (overrides = {}, token = csrf) => request(app).post('/api/v1/admin/users').set('Cookie', cookie).set('X-CSRF-Token', token).send({ ...input, ...overrides });
  beforeAll(async () => {
    if (!/^tms_wf005_[a-z0-9_]+_test$/.test(database)) throw new Error('Fresh dedicated WF-005 test database required.');
    admin = await mysql.createConnection({ host: process.env.WF005_TEST_DB_HOST || '127.0.0.1', port: Number(process.env.WF005_TEST_DB_PORT),
      user: process.env.WF005_TEST_DB_USER || 'root', password: process.env.WF005_TEST_DB_PASSWORD, multipleStatements: true });
    await admin.query(`CREATE DATABASE \`${database}\``); await admin.query(`USE \`${database}\``);
    for (const file of ['v1.0_participant-account-schema.sql', 'v1.1_participant-authentication-schema.sql']) {
      await admin.query(fs.readFileSync(path.join(__dirname, '../../db/migrations', file), 'utf8'));
    }
    const [actors] = await admin.query("SELECT account_identifier FROM users WHERE authentication_method = 'SYSTEM'");
    Object.assign(process.env, { DB_HOST: process.env.WF005_TEST_DB_HOST || '127.0.0.1', DB_PORT: process.env.WF005_TEST_DB_PORT,
      DB_USER: process.env.WF005_TEST_DB_USER || 'root', DB_PASSWORD: process.env.WF005_TEST_DB_PASSWORD, DB_NAME: database,
      STATIC_ADMINISTRATION_KEY: administrator.staticAdministrationKey, SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER: actors[0].account_identifier,
      SESSION_SECRET: 'isolated-administrative-session-secret-'.repeat(3), SESSION_COOKIE_SECURE: 'false',
      SYSTEM_ADMINISTRATOR_PERMISSIONS_JSON: '["ADMIN_USER_CREATE","ADMIN_USER_READ","ADMIN_USER_UPDATE"]',
      SYSTEM_ADMINISTRATOR_ACCESS_SCOPE_JSON: '["ALL_ADMINISTRATIVE_USERS"]', SYSTEM_ADMINISTRATOR_RESPONSIBILITIES_JSON: '["MANAGE_ADMINISTRATIVE_USERS"]',
      TRAINING_ADMINISTRATOR_PERMISSIONS_JSON: '["PROGRAM_MANAGE","CATEGORY_MANAGE","REGISTRATION_READ","REPORT_GENERATE"]',
      TRAINING_ADMINISTRATOR_ACCESS_SCOPE_JSON: '["ALL_TRAINING_OPERATIONS"]', TRAINING_ADMINISTRATOR_RESPONSIBILITIES_JSON: '["MANAGE_PROGRAMS","MANAGE_CATEGORIES","VIEW_REGISTRATIONS","GENERATE_REPORTS"]',
      TRAINER_PERMISSIONS_JSON: '["ASSIGNED_PROGRAM_READ","ASSIGNED_REGISTRATION_READ","ATTENDANCE_RECORD","CERTIFICATE_ISSUE"]',
      TRAINER_ACCESS_SCOPE_JSON: '["ASSIGNED_PROGRAMS"]', TRAINER_RESPONSIBILITIES_JSON: '["VIEW_ASSIGNED_PROGRAMS","VIEW_ASSIGNED_REGISTRATIONS","RECORD_ATTENDANCE","ISSUE_CERTIFICATES"]',
      PARTICIPANT_PERMISSIONS_JSON: '["PROGRAM_READ"]', PARTICIPANT_ACCESS_SCOPE_JSON: '["OWN_PARTICIPANT_RESOURCES"]', PARTICIPANT_RESPONSIBILITIES_JSON: '["VIEW_PROGRAMS"]' });
    pool = require('../../src/config/database'); app = require('../../src/app');
    await require('../../src/bindings/participant-authentication.bindings').credentials.initialize();
    await request(app).post('/api/v1/auth/system-admin/bootstrap').send(administrator).expect(201);
  }, 30000);
  beforeEach(async () => {
    await admin.query('DELETE FROM audit_records; DELETE FROM sessions; DELETE FROM authentication_failures; DELETE FROM participants;');
    await admin.query("DELETE FROM users WHERE authentication_method = 'PASSWORD' AND email <> ?", [administrator.email]);
    await admin.query("UPDATE users SET account_status = 'ACTIVE', role_id = 'SYSTEM_ADMINISTRATOR', role_name = 'SYSTEM_ADMINISTRATOR' WHERE email = ?", [administrator.email]);
    const response = await request(app).post('/api/v1/auth/system-admin/login').send({ email: administrator.email, password: administrator.password }).expect(200);
    cookie = response.headers['set-cookie'][0];
    const page = await request(app).get('/admin/users').set('Cookie', cookie).expect(200);
    csrf = /name="csrf-token" content="([a-f0-9]{64})"/.exec(page.text)[1];
    expect(page.headers['cache-control']).toBe('no-store');
  });
  afterAll(async () => {
    if (pool) await pool.end(); if (admin) await admin.end();
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]; Object.assign(process.env, saved);
  });
  test.each(['TRAINER', 'TRAINING_ADMINISTRATOR'])('creates %s with canonical access and authenticated creator audit', async role => {
    const response = await create({ role }).expect(201);
    expect(Object.keys(response.body).sort()).toEqual(['accountIdentifier', 'accountStatus', 'createdAt', 'email', 'name', 'role', 'userId', 'username']);
    expect(response.body.accountIdentifier).toMatch(/^A-[0-9A-HJKMNP-TV-Z]{26}$/); expect(response.body.username).toBe(input.username);
    const [rows] = await admin.query('SELECT * FROM users WHERE email = ?', [input.email]);
    expect(rows[0].role_id).toBe(role); expect(rows[0].role_name).toBe(role); expect(rows[0].account_status).toBe('ACTIVE');
    expect(await require('../../src/node_modules/argon2').verify(rows[0].password_hash, input.password)).toBe(true);
    const [audit] = await admin.query("SELECT a.*, u.email AS creator_email FROM audit_records a JOIN users u ON u.user_id = a.actor_user_id WHERE a.entity_type = 'ADMINISTRATIVE_USER_ACCOUNT' AND a.result = 'SUCCESS'");
    expect(audit).toHaveLength(1); expect(audit[0].creator_email).toBe(administrator.email);
    expect(JSON.stringify(audit)).not.toContain(input.password); expect(JSON.stringify(audit)).not.toContain(rows[0].password_hash);
    const [profiles] = await admin.query('SELECT * FROM participants'); expect(profiles).toHaveLength(0);
    const [sessions] = await admin.query('SELECT * FROM sessions'); expect(sessions).toHaveLength(1);
  });
  test('anonymous/expired sessions cannot create an account', async () => {
    await request(app).post('/api/v1/admin/users').send(input).expect(401);
    await admin.query('UPDATE sessions SET expires_at = UTC_TIMESTAMP() - INTERVAL 1 MINUTE'); await create().expect(401);
  });
  test('participant session is forbidden for both page and creation API', async () => {
    await request(app).post('/api/v1/auth/participants').send({ name: 'Participant', email: 'participant@example.test', nricPassportNo: 'TEST-ONLY', mobileNo: '+44 123', password: input.password }).expect(201);
    const response = await request(app).post('/api/v1/auth/participants/login').send({ email: 'participant@example.test', password: input.password }).expect(200);
    const participantCookie = response.headers['set-cookie'][0];
    await request(app).get('/admin/users').set('Cookie', participantCookie).expect(403);
    await request(app).post('/api/v1/admin/users').set('Cookie', participantCookie).set('X-CSRF-Token', csrf).send(input).expect(403);
  });
  test('CSRF rejection is audited and does not create a staff account', async () => {
    await create({}, 'wrong').expect(403);
    await request(app).post('/api/v1/admin/users').set('Cookie', cookie).send(input).expect(403);
    const [rows] = await admin.query('SELECT * FROM users WHERE email = ?', [input.email]); expect(rows).toHaveLength(0);
    const [audit] = await admin.query("SELECT * FROM audit_records WHERE action = 'CSRF_REJECTED'"); expect(audit).toHaveLength(2);
    expect(JSON.stringify(audit)).not.toContain(csrf);
  });
  test.each(['PARTICIPANT', 'SYSTEM_ADMINISTRATOR'])('forbids creating %s', async role => { await create({ role }).expect(403); });
  test.each(['username', 'email'])('concurrent duplicate %s commits one account and one creation audit', async field => {
    const other = field === 'username' ? { email: 'different@example.test' } : { username: 'different' };
    const responses = await Promise.all([create(), create(other)]);
    expect(responses.map(result => result.status).sort()).toEqual([201, 409]);
    const [rows] = await admin.query("SELECT * FROM users WHERE role_id = 'TRAINER'"); expect(rows).toHaveLength(1);
    const [audit] = await admin.query("SELECT * FROM audit_records WHERE entity_type = 'ADMINISTRATIVE_USER_ACCOUNT' AND result = 'SUCCESS'"); expect(audit).toHaveLength(1);
  });
  test.each(['users', 'audit_records'])('%s insert failure rolls back staff creation', async table => {
    await admin.query(`CREATE TRIGGER wf005_test_failure BEFORE INSERT ON ${table} FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Injected failure'`);
    try {
      await create().expect(500);
      const [rows] = await admin.query('SELECT * FROM users WHERE email = ?', [input.email]); expect(rows).toHaveLength(0);
      const [audit] = await admin.query("SELECT * FROM audit_records WHERE entity_type = 'ADMINISTRATIVE_USER_ACCOUNT' AND result = 'SUCCESS'"); expect(audit).toHaveLength(0);
    } finally { await admin.query('DROP TRIGGER wf005_test_failure'); }
  });
  test('a disabled creator cannot access the page or create accounts', async () => {
    await admin.query("UPDATE users SET account_status = 'DISABLED' WHERE email = ?", [administrator.email]);
    await request(app).get('/admin/users').set('Cookie', cookie).expect(401); await create().expect(401);
  });
  test('missing role configuration fails closed with no account', async () => {
    const previous = process.env.TRAINER_PERMISSIONS_JSON; delete process.env.TRAINER_PERMISSIONS_JSON;
    try {
      await create().expect(500); const [rows] = await admin.query('SELECT * FROM users WHERE email = ?', [input.email]); expect(rows).toHaveLength(0);
    } finally { process.env.TRAINER_PERMISSIONS_JSON = previous; }
  });
  test.each(['creator-disabled', 'session-expired'])('transaction recheck blocks %s after request authentication', async reason => {
    const passwords = require('../../src/bindings/administrative-user-creation.bindings').repositoriesAndServices.passwords;
    const original = passwords.hashPassword;
    passwords.hashPassword = async password => {
      const hash = await original(password);
      if (reason === 'creator-disabled') await admin.query("UPDATE users SET account_status = 'DISABLED' WHERE email = ?", [administrator.email]);
      else await admin.query('UPDATE sessions SET expires_at = UTC_TIMESTAMP() - INTERVAL 1 MINUTE');
      return hash;
    };
    try {
      await create().expect(reason === 'creator-disabled' ? 403 : 401);
      const [rows] = await admin.query('SELECT * FROM users WHERE email = ?', [input.email]); expect(rows).toHaveLength(0);
    } finally { passwords.hashPassword = original; }
  });
});
