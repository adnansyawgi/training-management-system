const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ejs = require('../../../src/node_modules/ejs');
const { JSDOM } = require('../../../src/node_modules/jsdom');
const ui = require('../../../src/config/ui');
const template = fs.readFileSync(path.join(__dirname, '../../../src/views/auth/admin-login.ejs'), 'utf8');
const sharedScript = fs.readFileSync(path.join(__dirname, '../../../src/public/js/account-forms.js'), 'utf8');
const script = sharedScript + '\n' + fs.readFileSync(path.join(__dirname, '../../../src/public/js/staff-login.js'), 'utf8');
let dom, document, fetchMock, navigate;
const field = id => document.getElementById(id);
const submit = async () => {
  field('loginForm').dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
  await new Promise(resolve => setImmediate(resolve));
};
beforeEach(async () => {
  dom = new JSDOM(ejs.render(template, { ...ui, workflow: 'WF-006', trainingAdministratorLandingUrl: '/test-admin-destination', trainerLandingUrl: '/test-trainer-destination', staffLoginJsUrl: '/js/staff-login.js', adminLandingUrl: '/test-admin-destination', systemAdministratorLoginJsUrl: '/js/staff-login.js' }), { url: 'http://localhost/admin/login' });
  document = dom.window.document;
  await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  fetchMock = jest.fn(); navigate = jest.fn();
  vm.runInNewContext(script, { document, fetch: fetchMock, window: { location: { assign: navigate } } });
  document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  field('email').value = 'admin@example.test'; field('password').value = 'old';
});
afterEach(() => dom.window.close());
test('only email and masked password are required, with no login complexity rules or static key', () => {
  expect([...document.querySelectorAll('input')].map(input => input.name)).toEqual(['email', 'password']);
  for (const id of ['email', 'password']) {
    expect(field(id).required).toBe(true); expect(document.querySelector(`label[for="${id}"]`)).not.toBeNull();
  }
  expect(field('password').type).toBe('password'); expect(field('password').hasAttribute('minlength')).toBe(false);
  expect(field('pageMessage').getAttribute('aria-live')).toBe('polite');
});
test('200 sends only credentials and navigates to the supplied destination after clearing password', async () => {
  fetchMock.mockResolvedValue({ status: 200, json: async () => ({ role: 'TRAINING_ADMINISTRATOR', status: 'ACTIVE' }) }); await submit();
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe('/api/v1/auth/staff/login'); expect(options.credentials).toBe('same-origin');
  expect(JSON.parse(options.body)).toEqual({ email: 'admin@example.test', password: 'old' });
  expect(field('password').value).toBe(''); expect(navigate).toHaveBeenCalledWith('/test-admin-destination');
});
test.each([400, 401, 423, 404, 409, 500])('%s gives fixed safe text and clears password without navigation', async status => {
  fetchMock.mockResolvedValue({ status, json: async () => ({ message: 'SQL password secret <script>' }) }); await submit();
  expect(field('pageMessage').textContent).not.toMatch(/SQL|secret|script/);
  expect(field('password').value).toBe(''); expect(field('loginButton').disabled).toBe(false);
  expect(navigate).not.toHaveBeenCalled();
});
test('network failure clears the password and enables retry', async () => {
  fetchMock.mockRejectedValue(new Error('private transport')); await submit();
  expect(field('pageMessage').textContent).toBe('Unable to connect to the service. Please try again.');
  expect(field('password').value).toBe(''); expect(field('loginButton').disabled).toBe(false);
});
test.each(['email', 'password'])('missing %s prevents submission', async id => {
  field(id).value = ''; await submit(); expect(fetchMock).not.toHaveBeenCalled();
});
test('pending repeated submissions are ignored', async () => {
  let resolve; fetchMock.mockImplementation(() => new Promise(done => { resolve = done; }));
  await submit(); await submit(); expect(fetchMock).toHaveBeenCalledTimes(1);
  resolve({ status: 401 }); await new Promise(done => setImmediate(done));
});

test('Trainer navigates using the canonical role in the successful server response', async () => {
 fetchMock.mockResolvedValue({ status: 200, json: async () => ({ role: 'TRAINER', status: 'ACTIVE' }) });
 await submit(); expect(navigate).toHaveBeenCalledWith('/test-trainer-destination');
});
test.each([{ role: 'SYSTEM_ADMINISTRATOR', status: 'ACTIVE' }, { role: 'TRAINER', status: 'DISABLED' }, {}])('unexpected success payload fails closed %j', async payload => {
 fetchMock.mockResolvedValue({ status: 200, json: async () => payload });
 await submit(); expect(navigate).not.toHaveBeenCalled();
 expect(field('pageMessage').textContent).toBe('Unable to authenticate. Please try again.');
});
test('malformed success response clears password without navigation', async () => {
 fetchMock.mockResolvedValue({ status: 200, json: async () => { throw new Error('private'); } });
 await submit(); expect(navigate).not.toHaveBeenCalled(); expect(field('password').value).toBe('');
});
