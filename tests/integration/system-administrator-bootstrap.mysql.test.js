const mysql = require('../../src/node_modules/mysql2/promise');
const request = require('../../src/node_modules/supertest');
const fs = require('fs');
const path = require('path');
const enabled = process.env.WF003_TEST_DB_PORT && process.env.WF003_TEST_DB_NAME;
(enabled ? describe : describe.skip)('WF-003 isolated MySQL bootstrap', () => {
  let admin, pool, app;
  const database = process.env.WF003_TEST_DB_NAME;
  const saved = { ...process.env };
  const input = { staticAdministrationKey: 'isolated-bootstrap-key', username: 'entered-admin', name: 'Admin', email: 'admin@example.test', password: 'StrongPassword@123' };
  const bootstrap = overrides => request(app).post('/api/v1/auth/system-admin/bootstrap').send({ ...input, ...overrides });
  beforeAll(async () => {
    if (!/^tms_wf003_[a-z0-9_]+_test$/.test(database)) throw new Error('Fresh dedicated WF-003 test database required.');
    admin = await mysql.createConnection({ host: process.env.WF003_TEST_DB_HOST || '127.0.0.1', port: Number(process.env.WF003_TEST_DB_PORT),
      user: process.env.WF003_TEST_DB_USER || 'root', password: process.env.WF003_TEST_DB_PASSWORD, multipleStatements: true });
    await admin.query(`CREATE DATABASE \`${database}\``);
    await admin.query(`USE \`${database}\``);
    for (const file of ['v1.0_participant-account-schema.sql', 'v1.1_participant-authentication-schema.sql']) {
      await admin.query(fs.readFileSync(path.join(__dirname, '../../db/migrations', file), 'utf8'));
    }
    const [actors] = await admin.query("SELECT account_identifier FROM users WHERE authentication_method = 'SYSTEM'");
    Object.assign(process.env, { DB_HOST: process.env.WF003_TEST_DB_HOST || '127.0.0.1', DB_PORT: process.env.WF003_TEST_DB_PORT,
      DB_USER: process.env.WF003_TEST_DB_USER || 'root', DB_PASSWORD: process.env.WF003_TEST_DB_PASSWORD, DB_NAME: database,
      STATIC_ADMINISTRATION_KEY: input.staticAdministrationKey, SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER: actors[0].account_identifier,
      SYSTEM_ADMINISTRATOR_PERMISSIONS_JSON: '["ADMIN_USER_CREATE","ADMIN_USER_READ","ADMIN_USER_UPDATE"]',
      SYSTEM_ADMINISTRATOR_ACCESS_SCOPE_JSON: '["ALL_ADMINISTRATIVE_USERS"]', SYSTEM_ADMINISTRATOR_RESPONSIBILITIES_JSON: '["MANAGE_ADMINISTRATIVE_USERS"]' });
    pool = require('../../src/config/database');
    app = require('../../src/app');
  }, 30000);
  beforeEach(async () => {
    await admin.query("DELETE FROM users WHERE authentication_method = 'PASSWORD'; DELETE FROM audit_records;");
  });
  afterAll(async () => {
    if (pool) await pool.end();
    if (admin) await admin.end();
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  });
  test('creates one ACTIVE canonical administrator with opaque ID, Argon2id and reserved-actor audit', async () => {
    const result = await bootstrap().expect(201);
    expect(result.body.accountIdentifier).toMatch(/^A-[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(result.body.username).toBe(input.username);
    expect(result.headers['set-cookie']).toBeUndefined();
    const [users] = await admin.query("SELECT * FROM users WHERE authentication_method = 'PASSWORD'");
    expect(users).toHaveLength(1);
    expect(users[0].role_id).toBe('SYSTEM_ADMINISTRATOR');
    expect(users[0].role_name).toBe('SYSTEM_ADMINISTRATOR');
    expect(users[0].password_hash).toMatch(/^\$argon2id\$/);
    expect(await require('../../src/node_modules/argon2').verify(users[0].password_hash, input.password)).toBe(true);
    const [profiles] = await admin.query('SELECT * FROM participants'); expect(profiles).toHaveLength(0);
    const [sessions] = await admin.query('SELECT * FROM sessions'); expect(sessions).toHaveLength(0);
    const [audit] = await admin.query('SELECT a.*, u.authentication_method FROM audit_records a JOIN users u ON u.user_id = a.actor_user_id');
    expect(audit).toHaveLength(1);
    expect(audit[0].authentication_method).toBe('SYSTEM');
    expect(JSON.stringify(audit)).not.toContain(input.staticAdministrationKey);
    expect(JSON.stringify(audit)).not.toContain(input.password);
    expect(Object.keys(users[0])).not.toContain('static_administration_key');
  });
  test('concurrent valid bootstraps commit exactly one active administrator', async () => {
    const results = await Promise.all([bootstrap(), bootstrap({ username: 'other-admin', email: 'other@example.test' })]);
    expect(results.map(result => result.status).sort()).toEqual([201, 409]);
    const [rows] = await admin.query("SELECT * FROM users WHERE role_id = 'SYSTEM_ADMINISTRATOR' AND account_status = 'ACTIVE'");
    expect(rows).toHaveLength(1);
    const [audit] = await admin.query("SELECT * FROM audit_records WHERE action = 'ACCOUNT_CREATED'"); expect(audit).toHaveLength(1);
  }, 30000);
  test.each(['users', 'audit_records'])('%s insert failure rolls back all bootstrap changes', async table => {
    await admin.query(`CREATE TRIGGER wf003_test_failure BEFORE INSERT ON ${table} FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Injected fixture failure'`);
    try {
      await bootstrap().expect(500);
      const [rows] = await admin.query("SELECT * FROM users WHERE authentication_method = 'PASSWORD'"); expect(rows).toHaveLength(0);
      const [audit] = await admin.query("SELECT * FROM audit_records WHERE action = 'ACCOUNT_CREATED'"); expect(audit).toHaveLength(0);
    } finally { await admin.query('DROP TRIGGER wf003_test_failure'); }
    // A failed transaction released the advisory lock, so a later attempt can succeed.
    await bootstrap().expect(201);
  });
  test.each(['username', 'email'])('duplicate %s maps to 409 without creating another account', async field => {
    await bootstrap().expect(201);
    await admin.query("UPDATE users SET account_status = 'DISABLED' WHERE authentication_method = 'PASSWORD'");
    await bootstrap(field === 'username' ? { email: 'different@example.test' } : { username: 'different-admin' }).expect(409);
    const [rows] = await admin.query("SELECT * FROM users WHERE authentication_method = 'PASSWORD'"); expect(rows).toHaveLength(1);
  });
  test('missing/invalid keys return 401 and produce rejection audit without credentials', async () => {
    await bootstrap({ staticAdministrationKey: 'wrong-key' }).expect(401);
    const { staticAdministrationKey, ...body } = input;
    await request(app).post('/api/v1/auth/system-admin/bootstrap').send(body).expect(401);
    const [rows] = await admin.query("SELECT * FROM audit_records WHERE action = 'BOOTSTRAP_REJECTED'");
    expect(rows).toHaveLength(2);
    expect(JSON.stringify(rows)).not.toMatch(/wrong-key|isolated-bootstrap-key|StrongPassword/);
    const [users] = await admin.query("SELECT * FROM users WHERE authentication_method = 'PASSWORD'"); expect(users).toHaveLength(0);
  });
});
