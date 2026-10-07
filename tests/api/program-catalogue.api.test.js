const express = require('../../src/node_modules/express');
const request = require('../../src/node_modules/supertest');
const { assemble } = require('../../src/program-catalogue.composition');
const { makeErrorHandler } = require('../../src/middleware/implementation-errors');
const correlation = require('../../src/middleware/correlation-id.middleware');
let app, catalogue;
const row = { program_id: '1', code: 'P-001', name: 'Program', category_id: '2', category_name: 'Category',
  training_date: '2026-12-01', start_time: '09:00:00', end_time: '10:00:00', venue: null,
  delivery_mode: 'ONLINE', capacity: 10, available_seats: 5, status: 'OPEN',
  registration_open_at: '2026-10-01 00:00:00', registration_close_at: '2026-11-30 00:00:00',
  trainer_user_id: 'secret', password_hash: 'private' };
beforeEach(() => {
  catalogue = { readPage: jest.fn().mockResolvedValue({ rows: [row], total: 1 }) };
  app = express(); app.use(correlation); app.use(express.json());
  app.use('/api/v1', assemble({ catalogue, configuration: {
    availabilityValues: ['AVAILABLE', 'FULL'], sortKeys: ['DATE_ASC', 'DATE_DESC', 'NAME_ASC', 'NAME_DESC'], defaultSort: 'DATE_ASC'
  } }));
  app.use(makeErrorHandler([400, 500]));
});
test('public response contains exactly the approved 15 fields and typed dates without internal data', async () => {
  const result = await request(app).get('/api/v1/programs').expect(200);
  expect(Object.keys(result.body).sort()).toEqual(['items', 'page', 'pageSize', 'total']);
  expect(Object.keys(result.body.items[0])).toHaveLength(15);
  expect(result.body.items[0]).toMatchObject({ programId: 1, categoryId: 2, trainingDate: '2026-12-01',
    startTime: '09:00:00', registrationOpenAt: '2026-10-01T00:00:00.000Z', venue: null });
  expect(JSON.stringify(result.body)).not.toMatch(/private|secret|trainer_user_id/);
  expect(result.headers['set-cookie']).toBeUndefined();
  expect(catalogue.readPage).toHaveBeenCalledWith({ page: 1, pageSize: 20, sort: 'DATE_ASC', offset: 0 });
});
test('validated filters and pagination reach the repository', async () => {
  await request(app).get('/api/v1/programs?page=2&pageSize=100&categoryId=2&availability=FULL&sort=NAME_DESC').expect(200);
  expect(catalogue.readPage).toHaveBeenCalledWith({ page: 2, pageSize: 100, offset: 100, categoryId: '2', availability: 'FULL', sort: 'NAME_DESC' });
});
test.each(['page=0', 'page=-1', 'page=1.5', 'pageSize=101', 'pageSize=0', 'page=9007199254740991&pageSize=100',
  'categoryId=9007199254740993', 'categoryId=0', 'availability=INJECT', 'sort=DROP%20TABLE',
  'status=DRAFT', 'page=1&page=2', 'categoryId[x]=1', 'availability=', 'sort='])('invalid query %s is rejected before SQL', async query => {
  await request(app).get('/api/v1/programs?' + query).expect(400);
  expect(catalogue.readPage).not.toHaveBeenCalled();
});
test('no matches is a valid empty page', async () => {
  catalogue.readPage.mockResolvedValue({ rows: [], total: 0 });
  const result = await request(app).get('/api/v1/programs').expect(200);
  expect(result.body).toEqual({ items: [], page: 1, pageSize: 20, total: 0 });
});
test.each(['database', 'unsafe-id', 'invalid-date'])('%s failure is sanitized', async reason => {
  if (reason === 'database') catalogue.readPage.mockRejectedValue(new Error('SQL password private'));
  else catalogue.readPage.mockResolvedValue({ rows: [{ ...row, ...(reason === 'unsafe-id' ? { program_id: '9007199254740993' } : { training_date: '2026-02-30' }) }], total: 1 });
  const result = await request(app).get('/api/v1/programs').expect(500);
  expect(JSON.stringify(result.body)).not.toMatch(/SQL|private|password/);
});
