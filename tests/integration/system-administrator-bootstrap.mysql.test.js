const mysql = require('../../src/node_modules/mysql2/promise');
const request = require('../../src/node_modules/supertest');
const fs = require('fs');
const path = require('path');
const enabled = process.env.WF003_TEST_DB_PORT && process.env.WF003_TEST_DB_NAME;
(enabled ? describe : describe.skip)('WF-003 isolated MySQL bootstrap', () => {
  let admin, pool, app;
  const database = process.env.WF003_TEST_DB_NAME;
  const saved = { ...process.env };
  const input = { username: 'entered-admin', name: 'Admin', email: 'admin@example.test', password: 'StrongPassword@123' };
  const bootstrap = overrides => request(app).post('/api/v1/auth/system-admin/bootstrap').send({ ...input, ...overrides });
  beforeAll(async () => {
    if (!/^tms_wf003_[a-z0-9_]+_test$/.test(database)) throw new Error('Fresh dedicated WF-003 test database required.');
    admin = await mysql.createConnection({ host: process.env.WF003_TEST_DB_HOST || '127.0.0.1', port: Number(process.env.WF003_TEST_DB_PORT),
      user: process.env.WF003_TEST_DB_USER || 'root', password: process.env.WF003_TEST_DB_PASSWORD, multipleStatements: true });
    await admin.query(`CREATE DATABASE \`${database}\``);
    await admin.query(`USE \`${database}\``);
    for (const file of ['v1.0_participant-account-schema.sql', 'v1.1_participant-authentication-schema.sql', 'v1.7_cr001_system_admin_bootstrap_state.sql']) {
      await admin.query(fs.readFileSync(path.join(__dirname, '../../db/migrations', file), 'utf8'));
    }
    const [actors] = await admin.query("SELECT account_identifier FROM users WHERE authentication_method = 'SYSTEM'");
    Object.assign(process.env, { DB_HOST: process.env.WF003_TEST_DB_HOST || '127.0.0.1', DB_PORT: process.env.WF003_TEST_DB_PORT,
      DB_USER: process.env.WF003_TEST_DB_USER || 'root', DB_PASSWORD: process.env.WF003_TEST_DB_PASSWORD, DB_NAME: database,
      SYSTEM_ADMIN_BOOTSTRAP_APPROVED_EMAIL: input.email, SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER: actors[0].account_identifier,
      SYSTEM_ADMINISTRATOR_PERMISSIONS_JSON: '["ADMIN_USER_CREATE","ADMIN_USER_READ","ADMIN_USER_UPDATE"]',
      SYSTEM_ADMINISTRATOR_ACCESS_SCOPE_JSON: '["ALL_ADMINISTRATIVE_USERS"]', SYSTEM_ADMINISTRATOR_RESPONSIBILITIES_JSON: '["MANAGE_ADMINISTRATIVE_USERS"]' });
    pool = require('../../src/config/database');
    app = require('../../src/app');
  }, 30000);
  beforeEach(async () => {
    await admin.query("DELETE FROM audit_records; DELETE FROM users WHERE authentication_method = 'PASSWORD'; UPDATE system_administrator_bootstrap_state SET completed_at = NULL, administrator_user_id = NULL WHERE state_id = 1;");
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
    expect(JSON.stringify(audit)).not.toContain(input.email);
    expect(JSON.stringify(audit)).not.toContain(input.password);
    expect(Object.keys(users[0])).not.toContain('static_administration_key');
    const [state] = await admin.query('SELECT * FROM system_administrator_bootstrap_state');
    expect(state[0].completed_at).not.toBeNull();
    expect(String(state[0].administrator_user_id)).toBe(String(users[0].user_id));
    expect(Object.keys(state[0]).sort()).toEqual(['administrator_user_id','completed_at','created_at','state_id','updated_at']);
  });
  test('concurrent valid bootstraps commit exactly one active administrator', async () => {
    const results = await Promise.all([bootstrap(), bootstrap({ username: 'other-admin' })]);
    expect(results.map(result => result.status).sort()).toEqual([201, 409]);
    const [rows] = await admin.query("SELECT * FROM users WHERE role_id = 'SYSTEM_ADMINISTRATOR' AND account_status = 'ACTIVE'");
    expect(rows).toHaveLength(1);
    const [audit] = await admin.query("SELECT * FROM audit_records WHERE action = 'ACCOUNT_CREATED'"); expect(audit).toHaveLength(1);
  }, 30000);
  test.each(['users', 'audit_records', 'system_administrator_bootstrap_state'])('%s insert failure rolls back all bootstrap changes', async table => {
    await admin.query(`CREATE TRIGGER wf003_test_failure BEFORE ${table === 'system_administrator_bootstrap_state' ? 'UPDATE' : 'INSERT'} ON ${table} FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Injected fixture failure'`);
    try {
      await bootstrap().expect(500);
      const [rows] = await admin.query("SELECT * FROM users WHERE authentication_method = 'PASSWORD'"); expect(rows).toHaveLength(0);
      const [audit] = await admin.query("SELECT * FROM audit_records WHERE action = 'ACCOUNT_CREATED'"); expect(audit).toHaveLength(0);
      const [state] = await admin.query('SELECT * FROM system_administrator_bootstrap_state');
      expect(state[0].completed_at).toBeNull();
      expect(state[0].administrator_user_id).toBeNull();
    } finally { await admin.query('DROP TRIGGER wf003_test_failure'); }
    // A failed transaction released the advisory lock, so a later attempt can succeed.
    await bootstrap().expect(201);
  });
  test.each(['username', 'email'])('duplicate %s before completion maps to sanitized 409', async field => {
    const { makeBootstrapRepository } = require('../../src/repositories/system-administrator-bootstrap.repository');
    const { errors } = require('../../src/auth/authentication-errors');
    const repository=makeBootstrapRepository({pool, errors});
    const connection=await pool.getConnection();
    try {
      const now=new Date();
      await repository.createWithIdentifierRetry(connection,{ username:field==='username'?input.username:'existing-user',
        email:field==='email'?input.email:'existing@example.test',name:'Existing',passwordHash:'fixture-only',
        roleId:'SYSTEM_ADMINISTRATOR',roleName:'SYSTEM_ADMINISTRATOR',permissions:[],accessScope:[],permittedResponsibilities:[],
        accountStatus:'DISABLED',roleAssignedAt:now,activatedAt:now,authenticationMethod:'PASSWORD',createdAt:now,updatedAt:now });
    } finally { connection.release(); }
    const response=await bootstrap().expect(409);
    expect(JSON.stringify(response.body)).not.toMatch(/SQL|users\.|Duplicate entry/);
    const [state]=await admin.query('SELECT * FROM system_administrator_bootstrap_state');
    expect(state[0].completed_at).toBeNull();
  });
  test('incorrect approved email returns 401 without account/completion or disclosure', async () => {
    const response = await bootstrap({ email: 'wrong@example.test' }).expect(401);
    expect(JSON.stringify(response.body)).not.toContain(input.email);
    const [rows] = await admin.query("SELECT * FROM audit_records WHERE action = 'BOOTSTRAP_REJECTED'");
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toMatch(/wrong@example|admin@example|StrongPassword/);
    const [users] = await admin.query("SELECT * FROM users WHERE authentication_method = 'PASSWORD'"); expect(users).toHaveLength(0);
    const [states] = await admin.query('SELECT * FROM system_administrator_bootstrap_state');
    expect(states[0].completed_at).toBeNull();
  });
  test('completion survives adapter/database reload and disabling or deleting initial administrator', async () => {
    await bootstrap().expect(201);
    await admin.query("UPDATE users SET account_status = 'DISABLED' WHERE authentication_method = 'PASSWORD'");
    await bootstrap().expect(409);
    const connection = await pool.getConnection();
    try {
      const repository = require('../../src/repositories/system-administrator-bootstrap.repository').makeBootstrapRepository({pool, errors:require('../../src/auth/authentication-errors').errors});
      const state = await repository.findBootstrapCompletionState(connection);
      expect(state.completed_at).not.toBeNull();
    } finally { connection.release(); }
    await admin.query("DELETE FROM users WHERE authentication_method = 'PASSWORD'");
    await bootstrap().expect(409);
    const [states] = await admin.query('SELECT * FROM system_administrator_bootstrap_state');
    expect(states[0].completed_at).not.toBeNull();
    expect(states[0].administrator_user_id).toBeNull();
  });
  test('a new Node application process still denies bootstrap after completion', async () => {
    await bootstrap().expect(201);
    const execute=require('node:util').promisify(require('node:child_process').execFile);
    const script=`const pool=require('./config/database');
      const {errors}=require('./auth/authentication-errors');
      const bootstrap=require('./repositories/system-administrator-bootstrap.repository').makeBootstrapRepository({pool,errors});
      const service=require('./services/system-administrator-bootstrap.service').makeService({bootstrap,errors,audit:{}});
      service.bootstrap({},{}).then(()=>{process.exitCode=1;}).catch(e=>{if(e.status!==409)process.exitCode=1;})
        .finally(()=>pool.end());`;
    await expect(execute(process.execPath,['-e',script],{cwd:path.join(__dirname,'../../src'),env:process.env})).resolves.toBeDefined();
  });
  test('singleton constraint and compatible FK enforce state integrity', async () => {
    await expect(admin.query("INSERT INTO system_administrator_bootstrap_state VALUES (2,NULL,NULL,NOW(6),NOW(6))")).rejects.toMatchObject({code:'ER_CHECK_CONSTRAINT_VIOLATED'});
    await expect(admin.query("UPDATE system_administrator_bootstrap_state SET completed_at=NOW(6), administrator_user_id=999999 WHERE state_id=1")).rejects.toMatchObject({code:'ER_NO_REFERENCED_ROW_2'});
  });
  test('legacy static key is rejected, normalized approved email succeeds without key', async () => {
    await bootstrap({staticAdministrationKey:'legacy'}).expect(400);
    await bootstrap({email:' ADMIN@EXAMPLE.TEST '}).expect(201);
  });
});
