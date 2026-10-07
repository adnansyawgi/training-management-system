const { JSDOM } = require('../src/node_modules/jsdom');
const ejs = require('../src/node_modules/ejs');
const fs = require('fs'), path = require('path');
const ui = require('../src/config/ui');
const bindings = { sortOptions:[{value:'REGISTERED_AT_DESC',label:'Newest first'}], defaultSort:'REGISTERED_AT_DESC' };
const record = { registrationId:1,referenceNo:'R-<script>',participantId:2,programId:3,registeredAt:'2026-10-07T01:00:00.000Z',status:'REGISTERED',cancelledAt:null,cancellationReason:null };
const listing = (items=[record],page=1,total=1) => ({items,page,pageSize:20,total});
const response = data => ({ok:true,json:async()=>data});
const tick = () => new Promise(resolve=>setImmediate(resolve));
async function page(fetch) {
  const html=ejs.render(fs.readFileSync(path.join(__dirname,'../src/views/admin/registration-management.ejs'),'utf8'),{...ui,...bindings,businessTimezone:'Asia/Kuala_Lumpur',workflowJsUrl:ui.registrationManagementJsUrl}, { filename: path.join(__dirname, "../src/views/admin/registration-management.ejs") });
  const dom=new JSDOM(html,{url:'http://localhost/admin/registrations',runScripts:'outside-only'});
  await new Promise(resolve=>dom.window.document.addEventListener('DOMContentLoaded',resolve,{once:true}));
  dom.window.businessTime=require('../src/public/js/business-time');dom.window.fetch=fetch;
  dom.window.eval(fs.readFileSync(path.join(__dirname,'../src/public/js/registration-management.js'),'utf8'));
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));await tick();return dom;
}
test('renders safe IDs/reference, fetches nine-field detail, displays local times and Back returns focus',async()=>{
  const fetch=jest.fn().mockResolvedValueOnce(response(listing())).mockResolvedValueOnce(response({...record,registrationRemarks:'<img src=x onerror=alert(1)>'}));
  const dom=await page(fetch),doc=dom.window.document;
  expect(doc.getElementById('registrationRows').textContent).toContain('R-<script>');expect(doc.querySelector('#registrationRows script')).toBeNull();
  doc.querySelector('#registrationRows button').click();await tick();expect(fetch.mock.calls[1][0]).toBe('/api/v1/admin/registrations/1');
  const fields=doc.getElementById('registrationDetailFields');expect(fields.textContent).toContain('<img src=x onerror=alert(1)>');expect(fields.querySelector('img')).toBeNull();expect(fields.textContent).toContain('2026-10-07 09:00:00');
  expect(doc.activeElement.id).toBe('detailHeading');doc.getElementById('closeDetail').click();expect(doc.getElementById('registrationDetail').classList.contains('d-none')).toBe(true);expect(doc.activeElement.textContent).toBe('View');dom.window.close();
});
test('Search sends approved filters, converts local periods and Clear resets to page one',async()=>{
  const fetch=jest.fn(async()=>response(listing([],1,0)));const dom=await page(fetch),doc=dom.window.document;
  doc.getElementById('periodFrom').value='2026-10-07T09:00';doc.getElementById('periodTo').value='2026-10-07T10:00';doc.getElementById('participantId').value='2';
  doc.getElementById('filterForm').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));await tick();
  const query=new URL(fetch.mock.calls[1][0],'http://localhost').searchParams;expect(query.get('periodFrom')).toBe('2026-10-07T01:00:00.000Z');expect(query.get('periodTo')).toBe('2026-10-07T02:00:00.000Z');expect(query.get('participantId')).toBe('2');expect(query.get('page')).toBe('1');expect(query.has('role')).toBe(false);
  doc.getElementById('clearSearch').click();await tick();const cleared=new URL(fetch.mock.calls[2][0],'http://localhost').searchParams;expect(cleared.has('participantId')).toBe(false);expect(cleared.has('periodFrom')).toBe(false);expect(doc.getElementById('emptyState').classList.contains('d-none')).toBe(false);dom.window.close();
});
test('detail always uses detail endpoint; HTTP 404 does not show list as detail',async()=>{
  const fetch=jest.fn().mockResolvedValueOnce(response(listing())).mockResolvedValueOnce({ok:false,status:404});const dom=await page(fetch),doc=dom.window.document;
  doc.querySelector('#registrationRows button').click();await tick();expect(doc.getElementById('pageMessage').textContent).toContain('no longer available');expect(doc.getElementById('registrationDetail').classList.contains('d-none')).toBe(true);dom.window.close();
});
test.each([400,401,403,500])('HTTP %i displays fixed text without server errors',async status=>{
  const fetch=jest.fn(async()=>({ok:false,status,json:async()=>({message:'SQL secret <script>'})}));const dom=await page(fetch),doc=dom.window.document;
  expect(doc.getElementById('pageMessage').textContent).not.toMatch(/SQL|secret|script/);expect(doc.getElementById('pageMessage').classList.contains('d-none')).toBe(false);expect(doc.getElementById('registrationRows').children).toHaveLength(0);dom.window.close();
});
test('network and malformed success fail closed with retry controls available',async()=>{
  for(const fetch of [jest.fn(async()=>{throw new Error('secret');}),jest.fn(async()=>response({items:[{...record,password:'secret'}],page:1,pageSize:20,total:1}))]){
    const dom=await page(fetch),doc=dom.window.document;expect(doc.getElementById('pageMessage').textContent).toBe('Unable to load registrations. Try again.');expect(doc.querySelector('button[type="submit"]').disabled).toBe(false);expect(doc.getElementById('nextPage').disabled).toBe(true);dom.window.close();
  }
});
test('pagination preserves filters and stale results cannot replace a new search',async()=>{
  let stale;const fetch=jest.fn().mockResolvedValueOnce(response(listing([record],1,21))).mockImplementationOnce(()=>new Promise(resolve=>{stale=resolve;})).mockResolvedValueOnce(response(listing([],1,0)));
  const dom=await page(fetch),doc=dom.window.document;doc.getElementById('nextPage').click();expect(new URL(fetch.mock.calls[1][0],'http://localhost').searchParams.get('page')).toBe('2');
  doc.getElementById('filterForm').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));await tick();stale(response(listing([record],2,21)));await tick();expect(doc.getElementById('registrationRows').children).toHaveLength(0);expect(doc.getElementById('pageInfo').textContent).toContain('Page 1');dom.window.close();
});
