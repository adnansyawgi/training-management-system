const mysql = require('../../src/node_modules/mysql2/promise');
const request = require('../../src/node_modules/supertest');
const fs = require('fs');
const path = require('path');
const { makeCatalogueRepository } = require('../../src/repositories/program-catalogue.repository');
const enabled = process.env.WF007_TEST_DB_PORT && process.env.WF007_TEST_DB_NAME;
(enabled ? describe : describe.skip)('WF-007 isolated MySQL catalogue', () => {
  let admin, pool, app, trainerId, participantId, active, other, inactive, open, full, closed;
  const database = process.env.WF007_TEST_DB_NAME;
  const saved = { ...process.env };
  beforeAll(async () => {
    if (!/^tms_wf007_[a-z0-9_]+_test$/.test(database)) throw new Error('Fresh dedicated WF-007 test database required.');
    admin = await mysql.createConnection({ host: process.env.WF007_TEST_DB_HOST || '127.0.0.1', port: Number(process.env.WF007_TEST_DB_PORT),
      user: process.env.WF007_TEST_DB_USER || 'root', password: process.env.WF007_TEST_DB_PASSWORD, multipleStatements: true });
    await admin.query(`CREATE DATABASE \`${database}\``);
    await admin.query(`USE \`${database}\``);
    for (const file of ['v1.0_participant-account-schema.sql', 'v1.1_participant-authentication-schema.sql', 'v1.2_program-catalogue-schema.sql']) {
      await admin.query(fs.readFileSync(path.join(__dirname, '../../db/migrations', file), 'utf8'));
    }
    Object.assign(process.env, { DB_HOST: process.env.WF007_TEST_DB_HOST || '127.0.0.1', DB_PORT: process.env.WF007_TEST_DB_PORT,
      DB_USER: process.env.WF007_TEST_DB_USER || 'root', DB_PASSWORD: process.env.WF007_TEST_DB_PASSWORD, DB_NAME: database });
    pool = require('../../src/config/database'); app = require('../../src/app');
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
    await registration(open, 'open-active'); await registration(open, 'open-cancelled', 'CANCELLED'); await registration(full, 'full-active');
  });
  afterAll(async () => {
    if (pool) await pool.end(); if (admin) await admin.end();
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  });
  const list = query => request(app).get('/api/v1/programs' + (query ? '?' + query : ''));
  test('public listing includes full OPEN/CLOSED programs and excludes hidden states/categories', async () => {
    const result = await list().expect(200);
    expect(result.body.total).toBe(3);
    expect(result.body.items.map(item => item.code)).toEqual(['A-open', 'B-full', 'C-closed']);
    expect(result.body.items.map(item => item.availableSeats)).toEqual([1, 0, 2]);
    expect(Object.keys(result.body.items[0])).toHaveLength(15);
    expect(result.body.items[0].trainingDate).toBe('2026-12-01');
    expect(result.body.items[0].registrationOpenAt).toBe('2026-10-01T00:00:00.000Z');
    expect(JSON.stringify(result.body)).not.toMatch(/Private description|trainer_user_id|fixture-hash/);
  });
  test('category and availability predicates match data/count and ignore cancelled registrations', async () => {
    const available = await list('availability=AVAILABLE').expect(200); expect(available.body.total).toBe(2);
    const result = await list('availability=FULL&categoryId=' + other).expect(200);
    expect(result.body.total).toBe(1); expect(result.body.items[0].programId).toBe(full);
    const empty = await list('categoryId=' + inactive).expect(200); expect(empty.body).toMatchObject({ items: [], total: 0 });
  });
  test.each(['DATE_ASC', 'DATE_DESC', 'NAME_ASC', 'NAME_DESC'])('%s ordering is deterministic with pagination', async sort => {
    const first = await list('pageSize=1&sort=' + sort).expect(200);
    const second = await list('page=2&pageSize=1&sort=' + sort).expect(200);
    const expected = sort === 'NAME_DESC' ? ['C-closed', 'B-full'] : ['A-open', 'B-full'];
    expect([first.body.items[0].code, second.body.items[0].code]).toEqual(expected);
    const beyond = await list('page=100&pageSize=1&sort=' + sort).expect(200);
    expect(beyond.body.items).toEqual([]); expect(beyond.body.total).toBe(3);
  });
  test('pageSize maximum and default pagination are respected', async () => {
    for (let index = 0; index < 22; index++) await program('Extra-' + index, 'OPEN');
    const result = await list().expect(200); expect(result.body.items).toHaveLength(20); expect(result.body.total).toBe(25);
    const second = await list('page=2').expect(200); expect(second.body.items).toHaveLength(5);
    await list('pageSize=101').expect(400);
  });
  test('count and rows use the same snapshot despite a concurrent committed change', async () => {
    const repository = makeCatalogueRepository({ pool: { async getConnection() {
      const connection = await pool.getConnection();
      return { query: connection.query.bind(connection), commit: connection.commit.bind(connection),
        rollback: connection.rollback.bind(connection), release: connection.release.bind(connection),
        async execute(sql, values) {
          const result = await connection.execute(sql, values);
          if (sql.startsWith('SELECT COUNT(*)')) await admin.execute("UPDATE training_programs SET status = 'CANCELLED' WHERE program_id = ?", [open]);
          return result;
        } };
    } } });
    const result = await repository.readPage({ page: 1, pageSize: 20, offset: 0, sort: 'DATE_ASC' });
    expect(Number(result.total)).toBe(3); expect(result.rows).toHaveLength(3);
    expect(result.rows.some(row => Number(row.program_id) === open)).toBe(true);
    expect((await list().expect(200)).body.total).toBe(2);
  });
  test('page renders escaped ACTIVE category names and public assets without authentication', async () => {
    const result = await request(app).get('/programs').expect(200);
    expect(result.text).toContain('Active &lt;script&gt;'); expect(result.text).not.toContain('>Hidden</option>');
    expect(result.headers['set-cookie']).toBeUndefined();
    await request(app).get('/js/program-list.js').expect(200);
  });
  test('invalid/injection filters return 400 without exposing SQL', async () => {
    for (const query of ['sort=DROP%20TABLE', "categoryId=1%20OR%201%3D1", 'availability=OPEN', 'page=1&page=2']) await list(query).expect(400);
    expect((await list().expect(200)).body.total).toBe(3);
  });
  test('migration enforces program/category/registration constraints and permits cancelled history', async () => {
    await expect(admin.execute('UPDATE training_programs SET capacity = 0 WHERE program_id = ?', [open])).rejects.toMatchObject({ code: 'ER_CHECK_CONSTRAINT_VIOLATED' });
    await expect(admin.execute('DELETE FROM program_categories WHERE category_id = ?', [active])).rejects.toMatchObject({ code: 'ER_ROW_IS_REFERENCED_2' });
    await expect(registration(open, 'duplicate-active')).rejects.toMatchObject({ code: 'ER_DUP_ENTRY' });
    await registration(open, 'another-cancelled', 'CANCELLED');
    expect((await list().expect(200)).body.items.find(item => item.programId === open).availableSeats).toBe(1);
  });
  test('no visible programs returns an empty 200 rather than an error', async () => {
    await admin.query("UPDATE training_programs SET status = 'DRAFT'");
    expect((await list().expect(200)).body).toEqual({ items: [], page: 1, pageSize: 20, total: 0 });
  });
});
