const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ejs = require('../../../src/node_modules/ejs');
const { JSDOM } = require('../../../src/node_modules/jsdom');
const ui = require('../../../src/config/ui');
const template = fs.readFileSync(path.join(__dirname, '../../../src/views/auth/participant-login.ejs'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '../../../src/public/js/participant-login.js'), 'utf8');
let dom, document, fetchMock, navigate;
const field = id => document.getElementById(id);
const submit = async () => {
  field('loginForm').dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
  await new Promise(resolve => setImmediate(resolve));
};
beforeEach(async () => {
  dom = new JSDOM(ejs.render(template, ui), { url: 'http://localhost/login' });
  document = dom.window.document;
  await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  fetchMock = jest.fn();
  navigate = jest.fn();
  vm.runInNewContext(script, { document, fetch: fetchMock, window: { location: { assign: navigate } } });
  document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  field('email').value = 'jane@example.test';
  field('password').value = 'old';
});
afterEach(() => dom.window.close());
test('only email/password, required labels and masked password are present', () => {
  expect([...document.querySelectorAll('input')].map(input => input.name)).toEqual(['email', 'password']);
  for (const id of ['email', 'password']) {
    expect(field(id).required).toBe(true);
    expect(document.querySelector(`label[for="${id}"]`)).not.toBeNull();
  }
  expect(field('password').type).toBe('password');
  expect(field('password').hasAttribute('minlength')).toBe(false);
  expect(field('pageMessage').getAttribute('aria-live')).toBe('polite');
  expect(document.querySelector('a').getAttribute('href')).toBe('/register');
});
test('success sends only credentials and navigates to the approved /programs target', async () => {
  fetchMock.mockResolvedValue({ status: 200 });
  await submit();
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe('/api/v1/auth/participants/login');
  expect(options.credentials).toBe('same-origin');
  expect(JSON.parse(options.body)).toEqual({ email: 'jane@example.test', password: 'old' });
  expect(navigate).toHaveBeenCalledWith('/programs');
  expect(field('password').value).toBe('');
});
test.each([400, 401, 423, 404, 409, 500])('sanitizes %s and clears password without navigation', async status => {
  fetchMock.mockResolvedValue({ status, json: async () => ({ message: '<script>SQL secret</script>' }) });
  await submit();
  expect(field('pageMessage').textContent).not.toMatch(/SQL|script|secret/);
  expect(field('pageMessage').classList.contains('d-none')).toBe(false);
  expect(field('password').value).toBe('');
  expect(field('loginButton').disabled).toBe(false);
  expect(navigate).not.toHaveBeenCalled();
});
test('network failure clears password and permits retry', async () => {
  fetchMock.mockRejectedValue(new Error('private transport details'));
  await submit();
  expect(field('pageMessage').textContent).toBe('Unable to connect to the service. Please try again.');
  expect(field('password').value).toBe('');
  expect(field('loginButton').disabled).toBe(false);
});
test.each(['email', 'password'])('missing %s prevents request', async id => {
  field(id).value = '';
  await submit();
  expect(fetchMock).not.toHaveBeenCalled();
});
test('repeated submission while pending is ignored', async () => {
  let resolve;
  fetchMock.mockImplementation(() => new Promise(done => { resolve = done; }));
  await submit();
  await submit();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  resolve({ status: 401 });
  await new Promise(done => setImmediate(done));
});
