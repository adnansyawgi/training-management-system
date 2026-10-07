const request = require('../../../src/node_modules/supertest');
const app = require('../../../src/app');
test('CR-001 public bootstrap page is removed', async () => {
  await request(app).get('/admin/bootstrap').expect(404);
  const home = await request(app).get('/').expect(200);
  expect(home.text).not.toContain('href="/admin/bootstrap"');
});
