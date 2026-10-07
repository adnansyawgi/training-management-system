const request = require('../../../src/node_modules/supertest');
const app = require('../../../src/app');
test('public detail page binds validated identity, assets and Back navigation without cookies', async () => {
  const result = await request(app).get('/programs/12').expect(200);
  expect(result.text).toContain('data-program-id="12"'); expect(result.text).toContain('href="/programs"');
  expect(result.text).toContain('/js/program-detail.js'); expect(result.headers['set-cookie']).toBeUndefined();
  await request(app).get('/js/program-detail.js').expect(200);
});
test.each(['/programs/0','/programs/abc','/programs/12?role=TRAINER'])('invalid page URL %s is rejected', async url => {
  await request(app).get(url).expect(400);
});
