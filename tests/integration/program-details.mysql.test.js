const mysql = require('../../src/node_modules/mysql2/promise');
const request = require('../../src/node_modules/supertest');
const fs = require('fs');
const path = require('path');
const { makeCatalogueRepository } = require('../../src/repositories/program-catalogue.repository');
const enabled = process.env.WF008_TEST_DB_PORT && process.env.WF008_TEST_DB_NAME;
(enabled ? describe : describe.skip)('WF-008 isolated MySQL catalogue', () => {
  let admin, pool, app, trainerId, participantId, active, other, inactive, open, full, closed;
  const database = process.env.WF008_TEST_DB_NAME;
  const saved = { ...process.env };
  beforeAll(async () => {
    if (!/^tms_wf008_[a-z0-9_]+_test$/.test(database)) throw new Error('Fresh dedicated WF-008 test database required.');
    admin = await mysql.createConnection({ host: process.env.WF008_TEST_DB_HOST || '127.0.0.1', port: Number(process.env.WF008_TEST_DB_PORT),
      user: process.env.WF008_TEST_DB_USER || 'root', password: process.env.WF008_TEST_DB_PASSWORD, multipleStatements: true });
    await admin.query(`CREATE DATABASE \`${database}\``);
    await admin.query(`USE \`${database}\``);
    for (const file of ['v1.0_participant-account-schema.sql', 'v1.1_participant-authentication-schema.sql', 'v1.2_program-catalogue-schema.sql']) {
      await admin.query(fs.readFileSync(path.join(__dirname, '../../db/migrations', file), 'utf8'));
    }
    Object.assign(process.env, { DB_HOST: process.env.WF008_TEST_DB_HOST || '127.0.0.1', DB_PORT: process.env.WF008_TEST_DB_PORT,
      DB_USER: process.env.WF008_TEST_DB_USER || 'root', DB_PASSWORD: process.env.WF008_TEST_DB_PASSWORD, DB_NAME: database });
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
  test('public detail matches catalogue visibility and returns the exact projection with trainer name only', async () => {
    const result = await request(app).get('/api/v1/programs/' + open).expect(200);
    expect(Object.keys(result.body)).toHaveLength(25);
    expect(result.body).toMatchObject({ programId: open, availableSeats: 1, trainerName: 'TRAINER', trainingDate: '2026-12-01', startTime: '09:00:00', prerequisites: null });
    expect(JSON.stringify(result.body)).not.toMatch(/trainerUserId|password_hash|fixture-hash|account_identifier/);
    const listing = await request(app).get('/api/v1/programs').expect(200);
    expect(result.body.availableSeats).toBe(listing.body.items.find(p => p.programId === open).availableSeats);
  });
  test('full and closed remain publicly readable', async () => {
    const result = await request(app).get('/api/v1/programs/' + full).expect(200);
    expect(result.body.availableSeats).toBe(0);
    expect((await request(app).get('/api/v1/programs/' + closed).expect(200)).body.status).toBe('CLOSED');
  });
  test('missing programs and all hidden states/categories return the same 404', async () => {
    const [rows] = await admin.query("SELECT program_id FROM training_programs WHERE status IN ('DRAFT','COMPLETED','CANCELLED') OR category_id = ?", [inactive]);
    for (const id of [...rows.map(row => row.program_id), 999999]) {
      const result = await request(app).get('/api/v1/programs/' + id).expect(404);
      expect(result.body.code).toBe('RESOURCE_NOT_FOUND');
    }
  });
  test('availability reflects committed registration changes and excludes cancelled history', async () => {
    expect((await request(app).get('/api/v1/programs/' + open).expect(200)).body.availableSeats).toBe(1);
    await admin.execute("UPDATE registrations SET status = 'CANCELLED', cancelled_at = UTC_TIMESTAMP() WHERE program_id = ?", [open]);
    expect((await request(app).get('/api/v1/programs/' + open).expect(200)).body.availableSeats).toBe(2);
    await registration(open, 'new-active');
    expect((await request(app).get('/api/v1/programs/' + open).expect(200)).body.availableSeats).toBe(1);
  });
  test('navigation page and read API create no registration, audit or session', async () => {
    const result = await request(app).get('/programs/' + open).expect(200);
    expect(result.text).toContain('data-program-id="' + open + '"');
    expect(result.headers['set-cookie']).toBeUndefined();
    await request(app).get('/api/v1/programs/' + open).expect(200);
    const [rows] = await admin.query('SELECT (SELECT COUNT(*) FROM registrations) AS registrations, (SELECT COUNT(*) FROM sessions) AS sessions, (SELECT COUNT(*) FROM audit_records) AS audits');
    expect(Number(rows[0].registrations)).toBe(3); expect(Number(rows[0].sessions)).toBe(0); expect(Number(rows[0].audits)).toBe(0);
  });
  test('injection and unsafe IDs are rejected before SQL lookup', async () => {
    for (const id of ['0', '1%20OR%201%3D1', '9007199254740993']) await request(app).get('/api/v1/programs/' + id).expect(400);
  });
});
