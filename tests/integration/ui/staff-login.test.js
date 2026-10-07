const request = require('../../../src/node_modules/supertest');
const app = require('../../../src/app');
test('staff login page renders both configured role destinations and delivers its script', async () => {
 const result = await request(app).get('/staff/login').expect(200);
 expect(result.text).toContain('Staff Login');
 expect(result.text).toContain('data-training-administrator-url="/admin/programs"');
 expect(result.text).toContain('data-trainer-url="/trainer/programs"');
 expect(result.text).toContain('/js/staff-login.js');
 expect(result.headers['set-cookie']).toBeUndefined();
 await request(app).get('/js/staff-login.js').expect(200);
});
