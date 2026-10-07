const fs = require('fs'), path = require('path'), vm = require('vm');
const ejs = require('../../../src/node_modules/ejs');
const { JSDOM } = require('../../../src/node_modules/jsdom');
const ui = require('../../../src/config/ui');
const configuration = require('../../../src/config/program-catalogue');
const template = fs.readFileSync(path.join(__dirname, '../../../src/views/programs/program-list.ejs'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '../../../src/public/js/program-list.js'), 'utf8');
let dom, document, fetchMock;
const field = id => document.getElementById(id);
const settle = () => new Promise(done => setImmediate(done));
const item = { programId: 12, code: 'P-12', name: '<script>unsafe</script>', categoryName: 'Category', trainingDate: '2026-12-01', availableSeats: 2, capacity: 10 };
const response = (items = [item], page = 1, total = 1) => ({ status: 200, json: async () => ({ items, page, pageSize: 20, total }) });
async function start(reply = response()) {
  fetchMock.mockResolvedValue(reply);
  vm.runInNewContext(script, { document, fetch: fetchMock, URLSearchParams });
  document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  await settle();
}
async function filter() {
  field('filterForm').dispatchEvent(new dom.window.Event('submit', { cancelable: true })); await settle();
}
beforeEach(async () => {
  dom = new JSDOM(ejs.render(template, { ...ui, categories: [{ categoryId: 2, name: '<b>Category</b>' }], availabilityOptions: configuration.availabilityOptions }, { filename: path.join(__dirname, "../../../src/views/programs/program-list.ejs") }), { url: 'http://localhost/programs' });
  document = dom.window.document;
  await new Promise(done => document.addEventListener('DOMContentLoaded', done, { once: true }));
  fetchMock = jest.fn();
});
afterEach(() => dom.window.close());
test('public controls have labels, approved filters and escaped category names', async () => {
  await start();
  expect(document.querySelector('label[for="categoryId"]')).not.toBeNull();
  expect([...field('availability').options].map(option => option.value)).toEqual(['', 'AVAILABLE', 'FULL']);
  expect(field('categoryId').textContent).toContain('<b>Category</b>');
  expect(field('categoryId').querySelector('b')).toBeNull();
  expect(field('pageMessage').getAttribute('aria-live')).toBe('polite');
});
test('initial fetch is bounded and safely renders program text with a detail link', async () => {
  await start();
  expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/programs?page=1&pageSize=20');
  expect(field('programRows').textContent).toContain('<script>unsafe</script>');
  expect(field('programRows').querySelector('script')).toBeNull();
  expect(field('programRows').querySelector('a').getAttribute('href')).toBe('/programs/12');
  expect(field('previousPage').disabled).toBe(true); expect(field('nextPage').disabled).toBe(true);
});
test('category and availability filters send only approved query fields and reset page', async () => {
  await start(response([item], 1, 21));
  fetchMock.mockResolvedValue(response([item], 2, 21)); field('nextPage').click(); await settle();
  expect(fetchMock.mock.calls.at(-1)[0]).toContain('page=2');
  field('categoryId').value = '2'; field('availability').value = 'FULL';
  fetchMock.mockResolvedValue(response([], 1, 0)); await filter();
  expect(fetchMock.mock.calls.at(-1)[0]).toBe('/api/v1/programs?page=1&pageSize=20&categoryId=2&availability=FULL');
  expect(field('emptyState').classList.contains('d-none')).toBe(false);
});
test('Previous and Next respect page boundaries', async () => {
  await start(response([item], 1, 21));
  field('previousPage').click(); expect(fetchMock).toHaveBeenCalledTimes(1);
  fetchMock.mockResolvedValue(response([item], 2, 21)); field('nextPage').click(); await settle();
  expect(field('nextPage').disabled).toBe(true); expect(field('previousPage').disabled).toBe(false);
  fetchMock.mockResolvedValue(response([item], 1, 21)); field('previousPage').click(); await settle();
  expect(field('pageInfo').textContent).toBe('Page 1');
});
test.each([400, 401, 403, 404, 409, 500])('%s clears stale rows and shows sanitized text with retry', async status => {
  await start(); fetchMock.mockResolvedValue({ status, json: async () => ({ message: 'SQL secret <script>' }) }); await filter();
  expect(field('programRows').children).toHaveLength(0);
  expect(field('pageMessage').textContent).not.toMatch(/SQL|secret|script/);
  expect(field('filterButton').disabled).toBe(false); expect(field('nextPage').disabled).toBe(true);
  expect(field('emptyState').classList.contains('d-none')).toBe(true);
});
test('network failure allows a successful retry and clears previous error', async () => {
  await start(); fetchMock.mockRejectedValue(new Error('private')); await filter();
  expect(field('pageMessage').textContent).toBe('Unable to connect to the service. Please try again.');
  fetchMock.mockResolvedValue(response()); await filter();
  expect(field('pageMessage').classList.contains('d-none')).toBe(true); expect(field('programRows').children).toHaveLength(1);
});
test('pending repeated requests cannot advance or replace the active page', async () => {
  let resolve; fetchMock.mockImplementation(() => new Promise(done => { resolve = done; }));
  vm.runInNewContext(script, { document, fetch: fetchMock, URLSearchParams });
  document.dispatchEvent(new dom.window.Event('DOMContentLoaded')); await filter(); field('nextPage').click();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  resolve(response()); await settle(); expect(field('filterButton').disabled).toBe(false);
});
test.each([{ items: [], page: 1, pageSize: 20, total: -1 }, { items: [{ ...item, programId: 'javascript:alert(1)' }], page: 1, pageSize: 20, total: 1 }, {}])('malformed response %j fails closed', async payload => {
  await start({ status: 200, json: async () => payload });
  expect(field('programRows').children).toHaveLength(0); expect(field('nextPage').disabled).toBe(true);
  expect(field('pageMessage').classList.contains('d-none')).toBe(false);
});
