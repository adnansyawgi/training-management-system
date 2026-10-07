const request = require('../../../src/node_modules/supertest');
const app = require('../../../src/app');
test('CR-001 legacy system-admin login bookmark redirects to common login', async () => {
  await request(app).get('/admin/login').expect(302).expect('Location', '/login');
});
