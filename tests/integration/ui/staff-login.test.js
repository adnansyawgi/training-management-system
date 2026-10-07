const request = require('../../../src/node_modules/supertest');
const app = require('../../../src/app');
test('CR-001 legacy staff login bookmark redirects to common login', async () => {
  await request(app).get('/staff/login').expect(302).expect('Location', '/login');
});
