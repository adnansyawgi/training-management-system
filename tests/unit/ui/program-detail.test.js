const fs = require('fs'), path = require('path'), vm = require('vm');
const ejs = require('../../../src/node_modules/ejs');
const { JSDOM } = require('../../../src/node_modules/jsdom');
const ui = require('../../../src/config/ui');
const row = require('../../fixtures/public-program-detail');
const { makeFeatureDto } = require('../../../src/repositories/program-details.dto');
const { makeResponseCodec } = require('../../../src/utils/implementation-response-codec');
const program = makeFeatureDto(makeResponseCodec()).programDetail(row);
const template = fs.readFileSync(path.join(__dirname, '../../../src/views/programs/program-detail.ejs'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '../../../src/public/js/program-detail.js'), 'utf8');
let dom, document, fetchMock;
const field = id => document.getElementById(id);
async function start(reply) {
  fetchMock.mockResolvedValue(reply || { status: 200, json: async () => program });
  vm.runInNewContext(script, { document, fetch: fetchMock });
  document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  await new Promise(done => setImmediate(done));
}
beforeEach(async () => {
  dom = new JSDOM(ejs.render(template, { ...ui, programId: '1' }, { filename: path.join(__dirname, "../../../src/views/programs/program-detail.ejs") }), { url: 'http://localhost/programs/1' });
  document = dom.window.document;
  await new Promise(done => document.addEventListener('DOMContentLoaded', done, { once: true })); fetchMock = jest.fn();
});
afterEach(() => dom.window.close());
test('renders public fields safely and Register performs navigation only', async () => {
  await start();
  expect(fetchMock).toHaveBeenCalledWith('/api/v1/programs/1', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
  expect(field('programDescription').textContent).toBe('<script>Description</script>');
  expect(field('programDescription').querySelector('script')).toBeNull();
  expect(field('programDetail').textContent).toContain('Trainer'); expect(field('programDetail').textContent).toContain('Objectives');
  expect(field('registerLink').getAttribute('href')).toBe('/programs/1/register');
  expect(field('registerLink').classList.contains('d-none')).toBe(false);
  expect(document.querySelectorAll('input,select,form')).toHaveLength(0);
  expect(document.querySelector('a[href="/programs"]')).not.toBeNull();
  expect(field('programArticle').getAttribute('aria-busy')).toBe('false');
});
test.each([{ status: 'CLOSED' }, { availableSeats: 0 }, { availableSeats: -1 }])('Register remains hidden for %j', async changes => {
  await start({ status: 200, json: async () => ({ ...program, ...changes }) });
  expect(field('registerLink').hasAttribute('href')).toBe(false); expect(field('registerLink').classList.contains('d-none')).toBe(true);
});
test.each([400, 401, 403, 404, 409, 500])('%s uses fixed safe text and no Register link', async status => {
  await start({ status, json: async () => ({ message: 'SQL private <script>' }) });
  expect(field('pageMessage').textContent).not.toMatch(/SQL|private|script/);
  if (status === 404) expect(field('pageMessage').textContent).toBe('Training program was not found.');
  expect(field('registerLink').hasAttribute('href')).toBe(false);
});
test.each([{}, { ...program, programId: 2 }, { ...program, status: 'DRAFT' }])('malformed detail %j fails closed', async payload => {
  await start({ status: 200, json: async () => payload });
  expect(field('programDetail').children).toHaveLength(0); expect(field('registerLink').hasAttribute('href')).toBe(false);
});
test('network failure clears loading state and exposes no transport details', async () => {
  vm.runInNewContext(script, { document, fetch: jest.fn().mockRejectedValue(new Error('SQL private')) });
  document.dispatchEvent(new dom.window.Event('DOMContentLoaded')); await new Promise(done => setImmediate(done));
  expect(field('pageMessage').textContent).toBe('Unable to connect to the service. Please try again.');
  expect(field('programArticle').getAttribute('aria-busy')).toBe('false');
});
