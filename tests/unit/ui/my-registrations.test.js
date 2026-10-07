const fs=require('fs'),path=require('path'),vm=require('vm');
const ejs=require('../../../src/node_modules/ejs');const {JSDOM}=require('../../../src/node_modules/jsdom');
const ui=require('../../../src/config/ui'),configuration=require('../../../src/config/registration-cancellation');
const businessTime=require('../../../src/public/js/business-time');
const template=fs.readFileSync(path.join(__dirname,'../../../src/views/registrations/my-registrations.ejs'),'utf8');
const script=fs.readFileSync(path.join(__dirname,'../../../src/public/js/my-registrations.js'),'utf8');
const item={registrationId:4,referenceNo:'R-4',programId:3,programName:'<script>Program</script>',trainingDate:'2099-12-01',startTime:'09:00:00',endTime:'10:00:00',status:'REGISTERED'};
let dom,document,fetchMock;
const field=id=>document.getElementById(id),settle=()=>new Promise(done=>setImmediate(done));
const response=(items=[item],page=1,total=1)=>({status:200,json:async()=>({items,page,pageSize:20,total})});
async function start(reply=response()){
  fetchMock.mockResolvedValue(reply);vm.runInNewContext(script,{document,fetch:fetchMock,URLSearchParams,businessTime});
  document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));await settle();
}
async function filter(){field('registrationFilter').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));await settle();}
beforeEach(async()=>{
  dom=new JSDOM(ejs.render(template,{...ui,csrfToken:'a'.repeat(64),businessTimezone:'Asia/Kuala_Lumpur',sortOptions:configuration.sortOptions}, { filename: path.join(__dirname, "../../../src/views/registrations/my-registrations.ejs") }),{url:'http://localhost/registrations'});
  document=dom.window.document;await new Promise(done=>document.addEventListener('DOMContentLoaded',done,{once:true}));fetchMock=jest.fn();
});
afterEach(()=>dom.window.close());
test('list renders safe text, View navigation and labeled optional 500-character reason',async()=>{
  await start();expect(field('registrationRows').textContent).toContain('<script>Program</script>');expect(field('registrationRows').querySelector('script')).toBeNull();
  expect(field('registrationRows').querySelector('a').getAttribute('href')).toBe('/programs/3');expect(field('cancellationReason').maxLength).toBe(500);
  expect(document.querySelector('label[for="cancellationReason"]')).not.toBeNull();expect(field('pageMessage').getAttribute('aria-live')).toBe('polite');
});
test.each([{status:'CANCELLED'},{trainingDate:'2000-01-01'},{trainingDate:'invalid'}])('Cancel visibility derives from status/schedule, without extra API flag %j',async change=>{
  await start(response([{...item,...change}]));expect(field('registrationRows').querySelector('button')).toBeNull();
});
test('Cancel opens confirmation; Back performs no mutation',async()=>{
  await start();field('registrationRows').querySelector('button').click();expect(field('cancelPanel').classList.contains('d-none')).toBe(false);
  field('cancellationReason').value='old reason';field('closeCancellation').click();expect(field('cancelPanel').classList.contains('d-none')).toBe(true);expect(field('cancellationReason').value).toBe('');expect(fetchMock).toHaveBeenCalledTimes(1);
});
test('confirmed cancellation sends only reason/CSRF, refreshes and closes panel',async()=>{
  await start();field('registrationRows').querySelector('button').click();field('cancellationReason').value='  Changed plans  ';
  fetchMock.mockResolvedValueOnce({status:200}).mockResolvedValueOnce(response([{...item,status:'CANCELLED'}]));field('confirmCancellation').click();await settle();
  const [url,options]=fetchMock.mock.calls[1];expect(url).toBe('/api/v1/registrations/4/cancel');expect(JSON.parse(options.body)).toEqual({cancellationReason:'Changed plans'});expect(options.headers['X-CSRF-Token']).toBe('a'.repeat(64));
  expect(field('pageMessage').textContent).toBe('Registration cancelled successfully.');expect(field('cancelPanel').classList.contains('d-none')).toBe(true);expect(fetchMock).toHaveBeenCalledTimes(3);expect(field('registrationRows').querySelector('button')).toBeNull();
});
test.each([400,401,403,404,409,500])('%s cancellation failure is safe and allows retry',async status=>{
  await start();field('registrationRows').querySelector('button').click();fetchMock.mockResolvedValue({status,json:async()=>({message:'SQL nric secret'})});field('confirmCancellation').click();await settle();
  expect(field('pageMessage').textContent).not.toMatch(/SQL|nric|secret/);expect(field('confirmCancellation').disabled).toBe(false);expect(field('cancelPanel').classList.contains('d-none')).toBe(false);
});
test('network cancellation failure and pending duplicate clicks are handled',async()=>{
  await start();field('registrationRows').querySelector('button').click();let reject;fetchMock.mockImplementation(()=>new Promise((_,fail)=>{reject=fail;}));field('confirmCancellation').click();field('confirmCancellation').click();expect(fetchMock).toHaveBeenCalledTimes(2);
  reject(new Error('private'));await settle();expect(field('pageMessage').textContent).toContain('Unable to connect');expect(field('confirmCancellation').disabled).toBe(false);
});
test('missing token or overflowing reason prevents cancellation',async()=>{
  await start();field('registrationRows').querySelector('button').click();field('cancellationReason').value='x'.repeat(501);field('confirmCancellation').click();await settle();expect(fetchMock).toHaveBeenCalledTimes(1);
  field('cancellationReason').value='';document.querySelector('meta[name="csrf-token"]').remove();field('confirmCancellation').click();await settle();expect(fetchMock).toHaveBeenCalledTimes(1);
});
test('filters and bounded paging reset selection and submit no participant identity',async()=>{
  await start(response([item],1,21));fetchMock.mockResolvedValue(response([item],2,21));field('nextPage').click();await settle();expect(fetchMock.mock.calls.at(-1)[0]).toContain('page=2');expect(field('nextPage').disabled).toBe(true);
  field('statusFilter').value='CANCELLED';field('sortFilter').value='DATE_DESC';fetchMock.mockResolvedValue(response([],1,0));await filter();expect(fetchMock.mock.calls.at(-1)[0]).toBe('/api/v1/registrations?page=1&pageSize=20&sort=DATE_DESC&status=CANCELLED');expect(field('emptyState').classList.contains('d-none')).toBe(false);
});
test('list error clears stale rows and disables pagination',async()=>{
  await start();fetchMock.mockResolvedValue({status:500,json:async()=>({message:'SQL secret'})});await filter();expect(field('registrationRows').children).toHaveLength(0);expect(field('nextPage').disabled).toBe(true);expect(field('pageMessage').textContent).toBe('Unable to load registrations.');
});
