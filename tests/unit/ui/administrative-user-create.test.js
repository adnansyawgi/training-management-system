const fs = require('fs'); const path = require('path'); const vm = require('vm');
const ejs = require('../../../src/node_modules/ejs'); const { JSDOM } = require('../../../src/node_modules/jsdom');
const ui = require('../../../src/config/ui');
const template = fs.readFileSync(path.join(__dirname, '../../../src/views/admin/user-account-management.ejs'), 'utf8');
const sharedScript = fs.readFileSync(path.join(__dirname, '../../../src/public/js/account-forms.js'), 'utf8');
const script = sharedScript + '\n' + fs.readFileSync(path.join(__dirname, '../../../src/public/js/administrative-user-create.js'), 'utf8');
const values = { username: 'entered-staff', name: 'Staff', email: 'staff@example.test', password: 'StrongPassword@123', role: 'TRAINER' };
let dom, document, fetchMock;
const field = id => document.getElementById(id);
const submit = async () => { field('administrativeUserForm').dispatchEvent(new dom.window.Event('submit', { cancelable: true })); await new Promise(resolve => setImmediate(resolve)); };
beforeEach(async () => {
  dom = new JSDOM(ejs.render(template, { ...ui, csrfToken: 'c'.repeat(64) }), { url: 'http://localhost/admin/users' }); document = dom.window.document;
  await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true })); fetchMock = jest.fn();
  vm.runInNewContext(script, { document, fetch: fetchMock }); document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  for (const [key, value] of Object.entries(values)) field(key).value = value;
});
afterEach(() => dom.window.close());
test('exact approved controls, limited role options and associated labels are present', () => {
  expect([...document.querySelectorAll('input, select')].map(input => input.name)).toEqual(Object.keys(values));
  for (const id of Object.keys(values)) { expect(field(id).required).toBe(true); expect(document.querySelector(`label[for="${id}"]`)).not.toBeNull(); }
  expect([...field('role').options].map(option => option.value)).toEqual(['', 'TRAINING_ADMINISTRATOR', 'TRAINER']);
  expect(field('password').type).toBe('password'); expect(field('pageMessage').getAttribute('aria-live')).toBe('polite');
});
test('201 sends five fields plus the server CSRF header and resets without navigation', async () => {
  fetchMock.mockResolvedValue({ status: 201 }); await submit();
  const [url, options] = fetchMock.mock.calls[0]; expect(url).toBe('/api/v1/admin/users'); expect(JSON.parse(options.body)).toEqual(values);
  expect(options.headers['X-CSRF-Token']).toBe('c'.repeat(64)); expect(options.credentials).toBe('same-origin');
  expect(field('password').value).toBe(''); expect(field('pageMessage').classList.contains('alert-success')).toBe(true);
});
test.each([400, 401, 403, 409, 500])('%s displays safe fixed text and clears the password', async status => {
  fetchMock.mockResolvedValue({ status, json: async () => ({ message: 'SQL secret <script>' }) }); await submit();
  expect(field('pageMessage').textContent).not.toMatch(/SQL|secret|script/); expect(field('password').value).toBe(''); expect(field('submitButton').disabled).toBe(false);
});
test('network failure permits safe retry', async () => {
  fetchMock.mockRejectedValue(new Error('private transport')); await submit(); expect(field('password').value).toBe('');
  expect(field('pageMessage').textContent).toBe('Unable to connect to the service. Please try again.');
});
test.each(Object.keys(values))('missing %s prevents submission', async id => { field(id).value = ''; await submit(); expect(fetchMock).not.toHaveBeenCalled(); });
test('weak credentials or missing server CSRF token do not submit', async () => {
  field('password').value = 'weak'; await submit(); expect(fetchMock).not.toHaveBeenCalled();
  field('password').value = values.password; document.querySelector('meta[name="csrf-token"]').remove(); await submit(); expect(fetchMock).not.toHaveBeenCalled();
});
test('pending duplicate submissions are ignored', async () => {
  let resolve; fetchMock.mockImplementation(() => new Promise(done => { resolve = done; })); await submit(); await submit();
  expect(fetchMock).toHaveBeenCalledTimes(1); resolve({ status: 409 }); await new Promise(done => setImmediate(done));
});
