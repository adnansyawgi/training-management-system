const mysql = require('../../src/node_modules/mysql2/promise');
const request = require('../../src/node_modules/supertest');
const fs = require('fs');
const path = require('path');
const enabled = process.env.WF004_TEST_DB_PORT && process.env.WF004_TEST_DB_NAME;
(enabled ? describe : describe.skip)('WF-004 isolated MySQL authentication', () => {
  let admin, pool, app, sessions;
  const database = process.env.WF004_TEST_DB_NAME;
  const saved = { ...process.env };
  const input = { username: 'entered-admin', name: 'Admin', email: 'admin@example.test', password: 'StrongPassword@123' };
  const login = overrides => request(app).post('/api/v1/auth/system-admin/login').send({ email: input.email, password: input.password, ...overrides });
  beforeAll(async () => {
    if (!/^tms_wf004_[a-z0-9_]+_test$/.test(database)) throw new Error('Fresh dedicated WF-004 test database required.');
    admin = await mysql.createConnection({ host: process.env.WF004_TEST_DB_HOST || '127.0.0.1', port: Number(process.env.WF004_TEST_DB_PORT),
      user: process.env.WF004_TEST_DB_USER || 'root', password: process.env.WF004_TEST_DB_PASSWORD, multipleStatements: true });
    await admin.query(`CREATE DATABASE \`${database}\``);
    await admin.query(`USE \`${database}\``);
    for (const file of ['v1.0_participant-account-schema.sql', 'v1.1_participant-authentication-schema.sql', 'v1.7_cr001_system_admin_bootstrap_state.sql']) {
      await admin.query(fs.readFileSync(path.join(__dirname, '../../db/migrations', file), 'utf8'));
    }
    const [actors] = await admin.query("SELECT account_identifier FROM users WHERE authentication_method = 'SYSTEM'");
    Object.assign(process.env, { DB_HOST: process.env.WF004_TEST_DB_HOST || '127.0.0.1', DB_PORT: process.env.WF004_TEST_DB_PORT,
      DB_USER: process.env.WF004_TEST_DB_USER || 'root', DB_PASSWORD: process.env.WF004_TEST_DB_PASSWORD, DB_NAME: database,
      SYSTEM_ADMIN_BOOTSTRAP_APPROVED_EMAIL: input.email, SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER: actors[0].account_identifier,
      SESSION_SECRET: 'isolated-admin-session-secret-'.repeat(3), SESSION_COOKIE_SECURE: 'false',
      SYSTEM_ADMINISTRATOR_PERMISSIONS_JSON: '["ADMIN_USER_CREATE","ADMIN_USER_READ","ADMIN_USER_UPDATE"]',
      SYSTEM_ADMINISTRATOR_ACCESS_SCOPE_JSON: '["ALL_ADMINISTRATIVE_USERS"]', SYSTEM_ADMINISTRATOR_RESPONSIBILITIES_JSON: '["MANAGE_ADMINISTRATIVE_USERS"]' });
    pool = require('../../src/config/database'); app = require('../../src/app');
    const bindings = require('../../src/bindings/participant-authentication.bindings'); sessions = bindings.sessions;
    await bindings.credentials.initialize();
    await request(app).post('/api/v1/auth/system-admin/bootstrap').send(input).expect(201);
  }, 30000);
  beforeEach(async () => {
    await admin.query('DELETE FROM sessions; DELETE FROM authentication_failures; DELETE FROM audit_records;');
    await admin.query("UPDATE users SET role_id = 'SYSTEM_ADMINISTRATOR', role_name = 'SYSTEM_ADMINISTRATOR', account_status = 'ACTIVE', failed_login_count = 0, lockout_until = NULL, last_login_at = NULL WHERE email = ?", [input.email]);
  });
  afterAll(async () => {
    if (pool) await pool.end(); if (admin) await admin.end();
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  });
  test('bootstrap-created administrator logs in and resolves an administrator session/audit', async () => {
    const result = await login().expect(200);
    expect(Object.keys(result.body).sort()).toEqual(['expiresAt', 'role', 'status', 'userId']);
    const principal = await sessions.load({ headers: { cookie: result.headers['set-cookie'][0] } });
    expect(principal.role).toBe('SYSTEM_ADMINISTRATOR'); expect(principal).not.toHaveProperty('participantId');
    const [audit] = await admin.query("SELECT * FROM audit_records WHERE action = 'AUTHENTICATION_SUCCEEDED'");
    expect(audit).toHaveLength(1); expect(audit[0].access_scope).toBe('ALL_ADMINISTRATIVE_USERS');
    expect(audit[0].change_summary).toBe('System Administrator authentication succeeded.');
    expect(JSON.stringify(audit)).not.toContain(input.password);
    const [profiles] = await admin.query('SELECT * FROM participants'); expect(profiles).toHaveLength(0);
  });
  test('unknown email and wrong password yield generic 401 with reserved-actor audits', async () => {
    const unknown = await login({ email: 'unknown@example.test' }).expect(401);
    const wrong = await login({ password: 'wrong' }).expect(401);
    expect(unknown.body.message).toBe(wrong.body.message);
    const [audit] = await admin.query("SELECT a.access_scope, u.authentication_method FROM audit_records a JOIN users u ON u.user_id = a.actor_user_id WHERE a.action = 'AUTHENTICATION_FAILED'");
    expect(audit).toHaveLength(2);
    expect(audit.every(row => row.access_scope === 'ALL_ADMINISTRATIVE_USERS' && row.authentication_method === 'SYSTEM')).toBe(true);
  });
  test('five concurrent failed credentials persist shared lockout atomically', async () => {
    const responses = await Promise.all(Array.from({ length: 5 }, () => login({ password: 'wrong' })));
    expect(responses.map(result => result.status)).toEqual([401, 401, 401, 401, 401]);
    await login().expect(423);
    const [users] = await admin.query('SELECT failed_login_count, lockout_until FROM users WHERE email = ?', [input.email]);
    expect(users[0].failed_login_count).toBe(5); expect(users[0].lockout_until).not.toBeNull();
    const [rows] = await admin.query('SELECT * FROM sessions'); expect(rows).toHaveLength(0);
  }, 30000);
  test.each([['INACTIVE', 401], ['DISABLED', 423], ['LOCKED', 423]])('%s is rejected with %s and no cookie', async (status, outcome) => {
    await admin.query('UPDATE users SET account_status = ? WHERE email = ?', [status, input.email]);
    const result = await login().expect(outcome); expect(result.headers['set-cookie']).toBeUndefined();
  });
  test.each(['PARTICIPANT', 'TRAINER', 'TRAINING_ADMINISTRATOR'])('rejects %s canonical role without creating a session', async role => {
    await admin.query('UPDATE users SET role_id = ?, role_name = ? WHERE email = ?', [role, role, input.email]);
    const result = await login().expect(401); expect(result.headers['set-cookie']).toBeUndefined();
  });
  test.each(['sessions', 'audit_records'])('%s insertion failure rolls back session and successful-login state', async table => {
    await admin.query(`CREATE TRIGGER wf004_test_failure BEFORE INSERT ON ${table} FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Injected failure'`);
    try {
      const result = await login().expect(500); expect(result.headers['set-cookie']).toBeUndefined();
      const [rows] = await admin.query('SELECT * FROM sessions'); expect(rows).toHaveLength(0);
      const [users] = await admin.query('SELECT last_login_at FROM users WHERE email = ?', [input.email]); expect(users[0].last_login_at).toBeNull();
    } finally { await admin.query('DROP TRIGGER wf004_test_failure'); }
  });
  test('signed session rotation replaces the prior browser session and checks live status', async () => {
    const first = await login().expect(200);
    const cookie = first.headers['set-cookie'][0];
    const second = await request(app).post('/api/v1/auth/system-admin/login').set('Cookie', cookie).send({ email: input.email, password: input.password }).expect(200);
    expect(second.headers['set-cookie'][0]).not.toBe(cookie);
    await expect(sessions.load({ headers: { cookie } })).resolves.toBeNull();
    await admin.query("UPDATE users SET account_status = 'DISABLED' WHERE email = ?", [input.email]);
    await expect(sessions.load({ headers: { cookie: second.headers['set-cookie'][0] } })).resolves.toBeNull();
  });
  test.each(['idle', 'absolute'])('expired administrator %s deadline invalidates the session', async deadline => {
    const response = await login().expect(200);
    if (deadline === 'idle') {
      await admin.query('UPDATE sessions SET expires_at = UTC_TIMESTAMP() - INTERVAL 1 MINUTE');
    } else {
      const [rows] = await admin.query('SELECT session_id, session_data FROM sessions');
      const data = JSON.parse(rows[0].session_data);
      data.absoluteExpiresAt = new Date(Date.now() - 60000).toISOString();
      await admin.query('UPDATE sessions SET session_data = ? WHERE session_id = ?', [JSON.stringify(data), rows[0].session_id]);
    }
    await expect(sessions.load({ headers: { cookie: response.headers['set-cookie'][0] } })).resolves.toBeNull();
    const [rows] = await admin.query('SELECT * FROM sessions'); expect(rows).toHaveLength(0);
  });
});
