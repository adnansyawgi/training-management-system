const request = require('../../../src/node_modules/supertest');
const app = require('../../../src/app');
test('administrator login renders configured navigation and shared assets without a session', async () => {
  const result = await request(app).get('/admin/login').expect(200);
  expect(result.text).toContain('System Administrator Login');
  expect(result.text).toContain('data-success-url="/admin/users"');
  expect(result.text).toContain('/js/system-admin-login.js');
  expect(result.headers['set-cookie']).toBeUndefined();
  await request(app).get('/js/system-admin-login.js').expect(200);
  await request(app).get('/admin/users').expect(404);
});
