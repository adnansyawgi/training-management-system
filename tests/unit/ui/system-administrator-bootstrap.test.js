const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ejs = require('../../../src/node_modules/ejs');
const { JSDOM } = require('../../../src/node_modules/jsdom');
const ui = require('../../../src/config/ui');
const template = fs.readFileSync(path.join(__dirname, '../../../src/views/auth/system-administrator-bootstrap.ejs'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '../../../src/public/js/system-administrator-bootstrap.js'), 'utf8');
let dom, document, fetchMock, navigate;
const field = id => document.getElementById(id);
const values = { staticAdministrationKey: 'test-key', username: 'entered-admin', name: 'Admin', email: 'admin@example.test', password: 'StrongPassword@123' };
const submit = async () => {
  field('systemAdminBootstrapForm').dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
  await new Promise(resolve => setImmediate(resolve));
};
beforeEach(async () => {
  dom = new JSDOM(ejs.render(template, ui), { url: 'http://localhost/admin/bootstrap' }); document = dom.window.document;
  await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  fetchMock = jest.fn(); navigate = jest.fn();
  vm.runInNewContext(script, { document, fetch: fetchMock, window: { location: { assign: navigate } } });
  document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  for (const [key, value] of Object.entries(values)) field(key).value = value;
});
afterEach(() => dom.window.close());
test('five required controls with entered username and masked credentials', () => {
  expect([...document.querySelectorAll('input')].map(input => input.name)).toEqual(Object.keys(values));
  for (const key of Object.keys(values)) {
    expect(field(key).required).toBe(true);
    expect(document.querySelector(`label[for="${key}"]`)).not.toBeNull();
  }
  expect(field('staticAdministrationKey').type).toBe('password'); expect(field('password').type).toBe('password');
  expect(field('pageMessage').getAttribute('aria-live')).toBe('polite');
});
test('201 sends only the approved body and navigates to /admin/login after clearing secrets', async () => {
  fetchMock.mockResolvedValue({ status: 201 }); await submit();
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(values);
  expect(navigate).toHaveBeenCalledWith('/admin/login');
  expect(field('staticAdministrationKey').value).toBe(''); expect(field('password').value).toBe('');
});
test.each([400, 401, 409, 500])('%s shows fixed safe text, clears credentials and does not navigate', async status => {
  fetchMock.mockResolvedValue({ status, json: async () => ({ message: 'SQL private-key <script>' }) }); await submit();
  expect(field('pageMessage').textContent).not.toMatch(/SQL|private-key|script/);
  expect(field('staticAdministrationKey').value).toBe(''); expect(field('password').value).toBe('');
  expect(field('submitButton').disabled).toBe(false); expect(navigate).not.toHaveBeenCalled();
});
test('network failure clears secrets and enables retry', async () => {
  fetchMock.mockRejectedValue(new Error('private error')); await submit();
  expect(field('pageMessage').textContent).toBe('Unable to connect to the service. Please try again.');
  expect(field('password').value).toBe(''); expect(field('staticAdministrationKey').value).toBe('');
});
test.each(['username', 'staticAdministrationKey', 'password'])('missing %s prevents submission', async id => {
  field(id).value = ''; await submit(); expect(fetchMock).not.toHaveBeenCalled();
});
test('weak password and repeated pending requests are guarded', async () => {
  field('password').value = 'weak'; await submit(); expect(fetchMock).not.toHaveBeenCalled();
  field('password').value = values.password;
  let resolve; fetchMock.mockImplementation(() => new Promise(done => { resolve = done; }));
  await submit(); await submit(); expect(fetchMock).toHaveBeenCalledTimes(1);
  resolve({ status: 401 }); await new Promise(done => setImmediate(done));
});
