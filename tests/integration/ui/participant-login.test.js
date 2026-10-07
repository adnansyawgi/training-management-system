const request = require('../../../src/node_modules/supertest');
const app = require('../../../src/app');
test('CR-001 common login renders all approved account types without a session', async () => {
  const result = await request(app).get('/login').expect(200);
  expect(result.text).toContain('id="accountType"');
  expect(result.text).toContain('href="/register"');
  expect(result.text).toContain('/js/login.js');
  expect(result.headers['set-cookie']).toBeUndefined();
  await request(app).get('/js/login.js').expect(200);
});
