const request = require('../../../src/node_modules/supertest');
const app = require('../../../src/app');
test('bootstrap page/assets are public with no session and navigate to administrator login', async () => {
  const result = await request(app).get('/admin/bootstrap').expect(200);
  expect(result.text).toContain('data-admin-login-url="/admin/login"');
  expect(result.headers['set-cookie']).toBeUndefined();
  await request(app).get('/js/system-administrator-bootstrap.js').expect(200);
  await request(app).get('/admin/login').expect(200);
});
