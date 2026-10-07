const fs=require('fs'),path=require('path'),vm=require('vm');
const ejs=require('../../../src/node_modules/ejs');const {JSDOM}=require('../../../src/node_modules/jsdom');
const ui=require('../../../src/config/ui');
const template=fs.readFileSync(path.join(__dirname,'../../../src/views/registrations/registration-confirmation.ejs'),'utf8');
const script=fs.readFileSync(path.join(__dirname,'../../../src/public/js/participant-registration.js'),'utf8');
let dom,document,fetchMock;
const field=id=>document.getElementById(id);const settle=()=>new Promise(done=>setImmediate(done));
const click=async()=>{field('confirmRegistration').click();await settle();};
beforeEach(async()=>{
  dom=new JSDOM(ejs.render(template,{...ui,csrfToken:'a'.repeat(64),program:{programId:3,name:'<script>Program</script>',trainingDate:'2026-12-01',startTime:'09:00:00',endTime:'10:00:00',availableSeats:1},participant:{name:'Participant',email:'participant@example.test',maskedNricPassportNo:'****1234'},programDetailsUrl:'/programs/3'}, { filename: path.join(__dirname, "../../../src/views/registrations/registration-confirmation.ejs") }),{url:'http://localhost/programs/3/register'});
  document=dom.window.document;await new Promise(done=>document.addEventListener('DOMContentLoaded',done,{once:true}));fetchMock=jest.fn();
  vm.runInNewContext(script,{document,fetch:fetchMock});document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
});
afterEach(()=>dom.window.close());
test('identity is read-only, masked and escaped; Cancel navigates without submitting',()=>{
  expect(document.querySelectorAll('input,select,textarea')).toHaveLength(0);expect(document.body.textContent).toContain('****1234');
  expect(document.querySelector('script:not([src])')).toBeNull();expect(document.querySelector('main a').getAttribute('href')).toBe('/programs/3');expect(fetchMock).not.toHaveBeenCalled();
});
test('201 submits only numeric program ID and CSRF, then prevents repeat confirmation',async()=>{
  fetchMock.mockResolvedValue({status:201});await click();await click();
  const [url,options]=fetchMock.mock.calls[0];expect(url).toBe('/api/v1/registrations');expect(JSON.parse(options.body)).toEqual({programId:3});
  expect(options.headers['X-CSRF-Token']).toBe('a'.repeat(64));expect(options.credentials).toBe('same-origin');
  expect(field('pageMessage').textContent).toBe('Registration created successfully.');expect(fetchMock).toHaveBeenCalledTimes(1);
});
test.each([400,401,403,404,409,500])('%s displays fixed safe error with retry enabled',async status=>{
  fetchMock.mockResolvedValue({status,json:async()=>({message:'SQL secret nric'})});await click();
  expect(field('pageMessage').textContent).not.toMatch(/SQL|secret|nric/);expect(field('confirmRegistration').disabled).toBe(false);
});
test('network failure allows retry',async()=>{fetchMock.mockRejectedValue(new Error('private'));await click();expect(field('pageMessage').textContent).toContain('Unable to connect');expect(field('confirmRegistration').disabled).toBe(false);});
test('pending repeated clicks send one request',async()=>{let resolve;fetchMock.mockImplementation(()=>new Promise(done=>{resolve=done;}));await click();await click();expect(fetchMock).toHaveBeenCalledTimes(1);resolve({status:409});await settle();});
test('missing CSRF stops submission',async()=>{document.querySelector('meta[name="csrf-token"]').remove();await click();expect(fetchMock).not.toHaveBeenCalled();});
