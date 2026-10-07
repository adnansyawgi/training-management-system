const request = require('../../../src/node_modules/supertest');
const app = require('../../../src/app');
test('login page binds approved navigation/assets without creating a session', async () => {
  const result = await request(app).get('/login').expect(200);
  expect(result.text).toContain('data-success-url="/programs"');
  expect(result.text).toContain('href="/register"');
  expect(result.text).toContain('/js/participant-login.js');
  expect(result.headers['set-cookie']).toBeUndefined();
  await request(app).get('/js/participant-login.js').expect(200);
  await request(app).get('/programs').expect(404);
});
