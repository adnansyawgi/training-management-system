// Opt in only against a disposable MySQL instance, never the application database.
const mysql = require('../../../src/node_modules/mysql2/promise');
const fs = require('fs');
const path = require('path');
const request = require('../../../src/node_modules/supertest');
const enabled = process.env.WF002_TEST_DB_PORT && process.env.WF002_TEST_DB_NAME;
const integration = enabled ? describe : describe.skip;
integration('WF-002 isolated MySQL integration', () => {
  let admin, pool, app, sessions;
  const database = process.env.WF002_TEST_DB_NAME;
  const saved = { ...process.env };
  const input = { name: 'Test Participant', email: 'wf002@example.test', nricPassportNo: 'WF002-TEST', mobileNo: '+44 123', password: 'StrongPassword@123' };
  const login = overrides => request(app).post('/api/v1/auth/participants/login').send({ email: input.email, password: input.password, ...overrides });
  beforeAll(async () => {
    if (!/^tms_wf002_[a-z0-9_]+_test$/.test(database)) throw new Error('Dedicated WF-002 test database name required.');
    admin = await mysql.createConnection({ host: process.env.WF002_TEST_DB_HOST || '127.0.0.1',
      port: Number(process.env.WF002_TEST_DB_PORT), user: process.env.WF002_TEST_DB_USER || 'root',
      password: process.env.WF002_TEST_DB_PASSWORD, multipleStatements: true });
    // CREATE fails if a database already exists; this suite only owns its fresh schema.
    await admin.query(`CREATE DATABASE \`${database}\``);
    await admin.query(`USE \`${database}\``);
    for (const file of ['v1.0_participant-account-schema.sql', 'v1.1_participant-authentication-schema.sql']) {
      await admin.query(fs.readFileSync(path.join(__dirname, '../../../db/migrations', file), 'utf8'));
    }
    const [actors] = await admin.query("SELECT account_identifier FROM users WHERE name = 'System Audit Actor'");
    Object.assign(process.env, { DB_HOST: process.env.WF002_TEST_DB_HOST || '127.0.0.1', DB_PORT: process.env.WF002_TEST_DB_PORT,
      DB_USER: process.env.WF002_TEST_DB_USER || 'root', DB_PASSWORD: process.env.WF002_TEST_DB_PASSWORD,
      DB_NAME: database, SESSION_SECRET: 'isolated-test-secret-'.repeat(4), SESSION_COOKIE_SECURE: 'false',
      SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER: actors[0].account_identifier,
      PARTICIPANT_PERMISSIONS_JSON: '["PROGRAM_READ","REGISTRATION_CREATE_OWN","REGISTRATION_READ_OWN","REGISTRATION_CANCEL_OWN"]',
      PARTICIPANT_ACCESS_SCOPE_JSON: '["OWN_PARTICIPANT_RESOURCES"]',
      PARTICIPANT_RESPONSIBILITIES_JSON: '["VIEW_PROGRAMS","CREATE_OWN_REGISTRATIONS","VIEW_OWN_REGISTRATIONS","CANCEL_OWN_REGISTRATIONS"]' });
    pool = require('../../../src/config/database');
    app = require('../../../src/app');
    const bindings = require('../../../src/participant-authentication.bindings');
    sessions = bindings.sessions;
    await bindings.credentials.initialize();
    await request(app).post('/api/v1/auth/participants').send(input).expect(201);
  }, 30000);
  afterAll(async () => {
    if (pool) await pool.end();
    // Preserve the fresh schema on failure for diagnosis; the disposable container
    // can be stopped after execution. Never drop an existing application database.
    if (admin) await admin.end();
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  });
  beforeEach(async () => {
    await admin.query('DELETE FROM sessions; DELETE FROM authentication_failures;');
    await admin.query("UPDATE users SET account_status = 'ACTIVE', role_id = 'PARTICIPANT', role_name = 'PARTICIPANT', failed_login_count = 0, lockout_until = NULL, last_login_at = NULL WHERE email = ?", [input.email]);
  });
  test('commits session/login state/audit and resolves the signed session principal', async () => {
    const result = await login().expect(200);
    expect(Object.keys(result.body).sort()).toEqual(['expiresAt', 'participantId', 'role', 'status', 'userId']);
    const [rows] = await admin.query('SELECT * FROM sessions');
    expect(rows).toHaveLength(1);
    const [users] = await admin.query('SELECT failed_login_count, last_login_at FROM users WHERE email = ?', [input.email]);
    expect(users[0].last_login_at).not.toBeNull();
    const [audit] = await admin.query("SELECT * FROM audit_records WHERE action = 'AUTHENTICATION_SUCCEEDED'");
    expect(audit).toHaveLength(1);
    expect(audit[0].actor_user_id).toBe(result.body.userId);
    const principal = await sessions.load({ headers: { cookie: result.headers['set-cookie'][0] } });
    expect(principal.userId).toBe(String(result.body.userId));
    expect(principal.participantId).toBe(String(result.body.participantId));
    expect(JSON.stringify(audit)).not.toContain(input.password);
  });
  test('five concurrent failures persist one lockout without losing increments', async () => {
    const responses = await Promise.all(Array.from({ length: 5 }, () => login({ password: 'wrong' })));
    expect(responses.map(response => response.status)).toEqual([401, 401, 401, 401, 401]);
    const [users] = await admin.query('SELECT failed_login_count, lockout_until FROM users WHERE email = ?', [input.email]);
    expect(users[0].failed_login_count).toBe(5);
    expect(users[0].lockout_until).not.toBeNull();
    await login().expect(423);
    const [rows] = await admin.query('SELECT * FROM sessions');
    expect(rows).toHaveLength(0);
  }, 30000);
  test('failure outside the observation window does not cause premature lockout', async () => {
    const [users] = await admin.query('SELECT user_id FROM users WHERE email = ?', [input.email]);
    for (let index = 0; index < 4; index += 1) {
      await admin.query('INSERT INTO authentication_failures (user_id, attempted_at) VALUES (?, UTC_TIMESTAMP() - INTERVAL 16 MINUTE)', [users[0].user_id]);
    }
    await login({ password: 'wrong' }).expect(401);
    const [state] = await admin.query('SELECT failed_login_count, lockout_until FROM users WHERE email = ?', [input.email]);
    expect(state[0].failed_login_count).toBe(1);
    expect(state[0].lockout_until).toBeNull();
    await login().expect(200);
    const [failures] = await admin.query('SELECT * FROM authentication_failures');
    expect(failures).toHaveLength(0);
  });
  test.each(['session', 'audit'])('%s insert failure rolls back successful-login state and session', async stage => {
    const table = stage === 'session' ? 'sessions' : 'audit_records';
    await admin.query(`CREATE TRIGGER wf002_test_failure BEFORE INSERT ON ${table} FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Injected fixture failure'`);
    try {
      const result = await login().expect(500);
      expect(result.headers['set-cookie']).toBeUndefined();
      const [rows] = await admin.query('SELECT * FROM sessions');
      expect(rows).toHaveLength(0);
      const [users] = await admin.query('SELECT last_login_at FROM users WHERE email = ?', [input.email]);
      expect(users[0].last_login_at).toBeNull();
    } finally { await admin.query('DROP TRIGGER wf002_test_failure'); }
  });
  test.each([['INACTIVE', 401], ['LOCKED', 423], ['DISABLED', 423]])('%s cannot establish a session', async (status, outcome) => {
    await admin.query('UPDATE users SET account_status = ? WHERE email = ?', [status, input.email]);
    const result = await login().expect(outcome);
    expect(result.headers['set-cookie']).toBeUndefined();
  });
  test('unknown email records a reserved-actor audit without fabricated participant identity', async () => {
    await login({ email: 'unknown@example.test' }).expect(401);
    const [rows] = await admin.query("SELECT a.actor_role, u.name FROM audit_records a JOIN users u ON u.user_id = a.actor_user_id WHERE a.entity_id = 'ANONYMOUS'");
    expect(rows).toEqual([{ actor_role: 'SYSTEM_ADMINISTRATOR', name: 'System Audit Actor' }]);
  });
  test('wrong canonical role cannot authenticate through the participant endpoint', async () => {
    await admin.query("UPDATE users SET role_id = 'TRAINER', role_name = 'TRAINER' WHERE email = ?", [input.email]);
    const result = await login().expect(401);
    expect(result.headers['set-cookie']).toBeUndefined();
  });
});
