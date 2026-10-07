const express = require('../../src/node_modules/express');
const request = require('../../src/node_modules/supertest');
const { assemble } = require('../../src/composition/program-details.composition');
const { makeErrorHandler } = require('../../src/middleware/implementation-errors');
const correlation = require('../../src/middleware/correlation-id.middleware');
const row = require('../fixtures/public-program-detail');
let app, programs;
beforeEach(() => {
  programs = { findPublicDetail: jest.fn().mockResolvedValue(row) };
  app = express(); app.use(correlation); app.use(express.json()); app.use('/api/v1', assemble({ programs }));
  app.use(makeErrorHandler([400, 404, 500]));
});
test('public detail contains exactly 25 approved fields and no trainer controls', async () => {
  const result = await request(app).get('/api/v1/programs/1').expect(200);
  expect(Object.keys(result.body).sort()).toEqual(['programId','code','name','description','objectives','targetAudience','prerequisites','categoryId','categoryName','trainerName','trainingDate','startTime','endTime','venue','deliveryMode','capacity','availableSeats','status','registrationOpenAt','registrationCloseAt','cancellationPolicyReference','certificateEligibilityCriteria','certificateType','createdAt','updatedAt'].sort());
  expect(result.body).toMatchObject({ programId: 1, categoryId: 2, prerequisites: null, trainerName: 'Trainer',
    trainingDate: '2026-12-01', startTime: '09:00:00', createdAt: '2026-10-01T00:00:00.000Z' });
  expect(JSON.stringify(result.body)).not.toMatch(/private|secret|trainerUserId|password_hash/);
  expect(programs.findPublicDetail).toHaveBeenCalledWith('1'); expect(result.headers['set-cookie']).toBeUndefined();
});
test.each(['0','-1','01','1.5','abc','9007199254740993','9223372036854775808','1%20OR%201%3D1'])('invalid ID %s is rejected before lookup', async id => {
  await request(app).get('/api/v1/programs/' + id).expect(400); expect(programs.findPublicDetail).not.toHaveBeenCalled();
});
test('unknown query fields are rejected', async () => { await request(app).get('/api/v1/programs/1?trainerUserId=2').expect(400); });
test('missing and invisible programs use the same sanitized 404', async () => {
  programs.findPublicDetail.mockResolvedValue(null); const result = await request(app).get('/api/v1/programs/1').expect(404);
  expect(result.body.code).toBe('RESOURCE_NOT_FOUND');
});
test.each(['database','unsafe-category','invalid-date','missing-field'])('%s failure returns sanitized 500', async reason => {
  if (reason === 'database') programs.findPublicDetail.mockRejectedValue(new Error('SQL private secret'));
  else { const bad = { ...row }; if (reason === 'unsafe-category') bad.category_id = '9007199254740993';
    if (reason === 'invalid-date') bad.training_date = '2026-02-30'; if (reason === 'missing-field') delete bad.trainer_name;
    programs.findPublicDetail.mockResolvedValue(bad); }
  const result = await request(app).get('/api/v1/programs/1').expect(500);
  expect(JSON.stringify(result.body)).not.toMatch(/SQL|private|secret/);
});
