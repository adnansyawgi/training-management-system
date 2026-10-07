const {JSDOM}=require('../src/node_modules/jsdom');
const fs=require('fs'),path=require('path');
const time=require('../src/public/js/business-time');
function page(kind='programs'){
  const fields={recordId:'',code:'CODE',name:'Name',categoryId:'3',trainerUserId:'4',capacity:'20',startTime:'09:00',endTime:'10:00',registrationOpenAt:'2026-10-01T09:00',registrationCloseAt:'2026-11-30T09:00'};
  const dom=new JSDOM('<meta name="csrf-token" content="token"><div id="management-message"></div><form id="management-form" data-kind="'+kind+'" data-timezone="Asia/Kuala_Lumpur">'+Object.entries(fields).map(([name,value])=>'<input name="'+name+'" value="'+value+'">').join('')+'<button type="submit">Save</button></form>',{runScripts:'outside-only',url:'http://localhost/admin/programs'});
  dom.window.businessTime=time;dom.window.eval(fs.readFileSync(path.join(__dirname,'../src/public/js/program-management.js'),'utf8'));
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));return dom;
}
test('business local timestamps round trip to UTC',()=>{
  const local=time.localDateTime('2026-10-01T01:00:00Z','Asia/Kuala_Lumpur');expect(local).toBe('2026-10-01T09:00:00');
  expect(time.scheduledStart(local.slice(0,10),local.slice(11),'Asia/Kuala_Lumpur').toISOString()).toBe('2026-10-01T01:00:00.000Z');
});
test('update sends only mutable fields, numeric values, UTC windows and csrf',async()=>{
  const dom=page();const {window}=dom;window.document.querySelector('[name="recordId"]').value='8';
  window.fetch=jest.fn(async()=>({ok:false,status:400}));
  window.document.querySelector('form').dispatchEvent(new window.Event('submit',{cancelable:true}));await new Promise(resolve=>setImmediate(resolve));
  const [url,options]=window.fetch.mock.calls[0];expect(url).toBe('/api/v1/admin/programs/8');expect(options.method).toBe('PUT');expect(options.headers['X-CSRF-Token']).toBe('token');
  const body=JSON.parse(options.body);expect(body).not.toHaveProperty('code');expect(body).not.toHaveProperty('recordId');expect(body.categoryId).toBe(3);expect(body.startTime).toBe('09:00:00');expect(body.registrationOpenAt).toBe('2026-10-01T01:00:00.000Z');dom.window.close();
});
test('pending submissions suppressed and errors displayed as text',async()=>{
  const dom=page();let complete;dom.window.fetch=jest.fn(()=>new Promise(resolve=>{complete=resolve;}));const form=dom.window.document.querySelector('form');
  form.dispatchEvent(new dom.window.Event('submit',{cancelable:true}));form.dispatchEvent(new dom.window.Event('submit',{cancelable:true}));expect(dom.window.fetch).toHaveBeenCalledTimes(1);
  complete({ok:false,status:409});await new Promise(resolve=>setImmediate(resolve));expect(dom.window.document.getElementById('management-message').textContent).toContain('already exists');expect(form.querySelector('button').disabled).toBe(false);dom.window.close();
});
