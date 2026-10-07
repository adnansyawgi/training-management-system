const request = require('../../../src/node_modules/supertest');
const app = require('../../../src/app');
const ui = require('../../../src/config/ui');

test('UI-T10: public registration renders approved route and asset/navigation bindings', async () => {
  const result = await request(app).get('/register').expect(200).expect('Content-Type', /html/);
  expect(result.text).toContain('Create Participant Account');
  expect(result.text).toContain(`href="${ui.bootstrapCssUrl}"`);
  expect(result.text).toContain(`integrity="${ui.bootstrapCssIntegrity}"`);
  expect(result.text).toContain('crossorigin="anonymous"');
  expect(result.text.match(/href="\/login"/g)).toHaveLength(2);
  expect(result.headers['set-cookie']).toBeUndefined();
  for (const asset of [ui.appCssUrl, ui.participantRegisterJsUrl]) {
    await request(app).get(asset).expect(200);
    expect(result.text).toContain(asset);
  }
});

test('UI-T12: existing API validation, correlation and unknown routes remain intact', async () => {
  const result = await request(app).post('/api/v1/auth/participants').send({}).expect(400);
  expect(result.body.code).toBe('VALIDATION_ERROR');
  expect(result.body.correlationId).toBeTruthy();
  expect(result.headers['set-cookie']).toBeUndefined();
  await request(app).get('/not-a-route').expect(404);
  await request(app).get('/login').expect(200);
});
