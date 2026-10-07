const fs = require('fs');
const path = require('path');
const ejs = require('../../../src/node_modules/ejs');
const { JSDOM } = require('../../../src/node_modules/jsdom');
const ui = require('../../../src/config/ui');

const template = fs.readFileSync(path.join(__dirname, '../../../src/views/auth/participant-register.ejs'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '../../../src/public/js/participant-register.js'), 'utf8');
const values = {
  nricPassportNo: ' A123 ', name: ' Jane Tan ', email: ' jane@example.com ',
  mobileNo: ' +44 1234 ', password: 'StrongPassword@123'
};
let dom, document, fetchMock;
const field = id => document.getElementById(id);
const submit = async () => {
  field('participantRegisterForm').dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
  await new Promise(resolve => setImmediate(resolve));
};
const response = (status, body) => ({ status, json: async () => body });

beforeEach(async () => {
  dom = new JSDOM(ejs.render(template, ui, { filename: path.join(__dirname, "../../../src/views/auth/participant-register.ejs") }), { url: 'http://localhost/register', runScripts: 'outside-only' });
  document = dom.window.document;
  await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  fetchMock = jest.fn();
  dom.window.fetch = fetchMock;
  dom.window.eval(script);
  document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  for (const [id, value] of Object.entries(values)) field(id).value = value;
});
afterEach(() => dom.window.close());

test('UI-T01/T02/T03: exactly five required inputs, approved limits and masked password', () => {
  const inputs = [...document.querySelectorAll('input')];
  expect(inputs.map(input => input.name)).toEqual(Object.keys(values));
  expect(inputs.every(input => input.required)).toBe(true);
  for (const [id, limit] of Object.entries({ nricPassportNo: 50, name: 200, email: 254, mobileNo: 30 })) {
    expect(field(id).maxLength).toBe(limit);
    expect(field(id).hasAttribute('pattern')).toBe(false);
  }
  expect(field('email').type).toBe('email');
  expect(field('password').type).toBe('password');
  expect(field('password').minLength).toBe(12);
});

test.each(Object.keys(values))('UI-T03: missing %s prevents submission', async id => {
  field(id).value = '';
  await submit();
  expect(fetchMock).not.toHaveBeenCalled();
  expect(field('participantRegisterForm').classList.contains('was-validated')).toBe(true);
});

test.each(['weak', 'lowercase123!', 'UPPERCASE123!', 'NoDigitsHere!', 'NoSymbols1234'])('UI-T03: rejects weak password %s inline', async value => {
  field('password').value = value;
  field('password').reportValidity = jest.fn();
  field('password').dispatchEvent(new dom.window.Event('input'));
  await submit();
  expect(fetchMock).not.toHaveBeenCalled();
  expect(field('password').validationMessage).not.toBe('');
  expect(field('password').reportValidity).not.toHaveBeenCalled();
});

test('UI-T03: invalid email prevents submission', async () => {
  field('email').value = 'invalid-email';
  await submit();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('UI-T04/T05: sends five fields, clears inputs and offers explicit login without navigation/session', async () => {
  fetchMock.mockResolvedValue(response(201, { participantId: 123, status: 'ACTIVE' }));
  document.cookie = '';
  await submit();
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe('/api/v1/auth/participants');
  expect(options.method).toBe('POST');
  expect(options.headers['Content-Type']).toBe('application/json; charset=utf-8');
  expect(JSON.parse(options.body)).toEqual({
    nricPassportNo: 'A123', name: 'Jane Tan', email: 'jane@example.com', mobileNo: '+44 1234', password: values.password
  });
  expect(field('formMessage').textContent).toContain('Account created successfully');
  expect(field('successActions').classList.contains('d-none')).toBe(false);
  expect(field('successLoginLink').getAttribute('href')).toBe('/login');
  expect([...document.querySelectorAll('input')].every(input => input.value === '')).toBe(true);
  expect(dom.window.location.pathname).toBe('/register');
  expect(document.cookie).toBe('');
  expect(dom.window.localStorage.length).toBe(0);
  expect(dom.window.sessionStorage.length).toBe(0);
  expect(script).not.toMatch(/setTimeout|setInterval/);
});

test.each([
  [400, { message: 'Account creation information is invalid.' }, 'Account creation information is invalid.'],
  [409, { message: 'The supplied account information cannot be used.' }, 'The supplied account information cannot be used.'],
  [400, {}, 'Please correct the information entered and try again.'],
  [409, { message: ' ' }, 'An account already exists with the supplied unique information.'],
  [500, { message: 'SQL duplicate A123 password=secret constraint users_email', details: 'stack' }, 'Unable to create the account. Please try again.'],
  [403, { message: 'internal transport detail' }, 'Unable to create the account. Please try again.'],
  [200, { message: 'unexpected success' }, 'Unable to create the account. Please try again.']
])('UI-T06/T07/T08: HTTP %s renders the controlled outcome and clears password', async (status, body, message) => {
  fetchMock.mockResolvedValue(response(status, body));
  await submit();
  expect(field('formMessage').textContent).toBe(message);
  expect(field('password').value).toBe('');
  expect(field('nricPassportNo').value).toBe(values.nricPassportNo);
  expect(field('successActions').classList.contains('d-none')).toBe(true);
  expect(field('createAccountButton').disabled).toBe(false);
});

test('UI-T06: approved corrective message is rendered as text, never HTML', async () => {
  fetchMock.mockResolvedValue(response(400, { message: '<img src=x onerror=alert(1)>', details: 'private A123' }));
  await submit();
  expect(field('formMessage').querySelector('img')).toBeNull();
  expect(field('formMessage').textContent).toBe('<img src=x onerror=alert(1)>');
});

test.each([201, 400, 500])('malformed JSON at HTTP %s uses the approved status outcome', async status => {
  fetchMock.mockResolvedValue({ status, json: async () => { throw new Error('invalid JSON'); } });
  await submit();
  expect(field('formMessage').textContent).not.toContain('invalid JSON');
  expect(field('password').value).toBe('');
  expect(field('formMessage').textContent).toContain(status === 201 ? 'Account created successfully' : status === 400 ? 'Please correct' : 'Unable to create');
});

test('UI-T09: network failure is sanitized and allows retry with a new password', async () => {
  fetchMock.mockRejectedValue(new Error('internal transport secret'));
  await submit();
  expect(field('formMessage').textContent).toBe('Unable to connect to the service. Please try again.');
  expect(field('password').value).toBe('');
  expect(field('createAccountButton').disabled).toBe(false);
  expect(field('createAccountSpinner').classList.contains('d-none')).toBe(true);
  field('password').value = values.password;
  fetchMock.mockResolvedValue(response(201, {}));
  await submit();
  expect(field('formMessage').textContent).toContain('Account created successfully');
});

test('pending submission disables button and rejects duplicate submissions', async () => {
  let resolveRequest;
  fetchMock.mockImplementation(() => new Promise(resolve => { resolveRequest = resolve; }));
  await submit();
  expect(field('createAccountButton').disabled).toBe(true);
  expect(field('createAccountSpinner').classList.contains('d-none')).toBe(false);
  await submit();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  resolveRequest(response(201, {}));
  await new Promise(resolve => setImmediate(resolve));
  expect(field('createAccountButton').disabled).toBe(false);
});

test('UI-T11: labels, live outcome, password help and native keyboard controls', () => {
  for (const input of document.querySelectorAll('input')) {
    expect(document.querySelector(`label[for="${input.id}"]`)).not.toBeNull();
    expect(input.tabIndex).toBe(0);
  }
  expect(field('formMessage').getAttribute('role')).toBe('alert');
  expect(field('formMessage').getAttribute('aria-live')).toBe('polite');
  expect(field('password').getAttribute('aria-describedby')).toBe('passwordHelp');
  expect(document.querySelector('a.btn-outline-secondary').getAttribute('href')).toBe('/login');
  expect(field('createAccountButton').type).toBe('submit');
});
