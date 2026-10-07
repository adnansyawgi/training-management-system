const {JSDOM}=require('../src/node_modules/jsdom'),ejs=require('../src/node_modules/ejs');
const fs=require('fs'),path=require('path'),ui=require('../src/config/ui'),time=require('../src/public/js/business-time');
const row={registrationId:2,referenceNo:'R-<script>',participantName:'<img> Participant',status:'PRESENT',attendanceDate:'2026-10-07',checkInAt:'2026-10-07T01:00:00Z',checkOutAt:null,verificationMethod:null,evidenceReference:null,remarks:'<script>saved'};
const success={items:[{attendanceId:1,registrationId:2,participantId:3,programId:4,attendanceDate:'2026-10-07',status:'PRESENT',percentage:100,recordedBy:5}]};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function page(fetch){
  const html=ejs.render(fs.readFileSync(path.join(__dirname,'../src/views/trainer/attendance-management.ejs'),'utf8'),{...ui,program:{programId:4,code:'CODE',name:'Program'},assignedPrograms:[{programId:4,code:'CODE',name:'Program'},{programId:6,code:'OTHER',name:'Other'}],records:[row],businessTimezone:'Asia/Kuala_Lumpur',csrfToken:'token',localInput:value=>value===null?'':time.localDateTime(value,'Asia/Kuala_Lumpur'),page:1,total:1}, { filename: path.join(__dirname, "../src/views/trainer/attendance-management.ejs") });
  const dom=new JSDOM(html,{url:'http://localhost/trainer/programs/4/attendance',runScripts:'outside-only'});await new Promise(resolve=>dom.window.document.addEventListener('DOMContentLoaded',resolve,{once:true}));
  dom.window.businessTime=time;dom.window.fetch=fetch;dom.window.eval(fs.readFileSync(path.join(__dirname,'../src/public/js/attendance-management.js'),'utf8'));dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  dom.window.document.getElementById('attendanceDate').value='2026-10-07';return dom;
}
function submit(dom){dom.window.document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));}
test('sends only authoritative request fields, UTC optional times and CSRF; displays confirmed success',async()=>{
  const fetch=jest.fn(async()=>({ok:true,json:async()=>success})),dom=await page(fetch),doc=dom.window.document;
  expect(doc.querySelector('tbody img')).toBeNull();expect(doc.querySelector('tbody script')).toBeNull();expect(doc.querySelector('tbody').textContent).toContain('R-<script>');submit(dom);await tick();
  const [url,options]=fetch.mock.calls[0];expect(url).toBe('/api/v1/trainer/programs/4/attendance');expect(options.headers['X-CSRF-Token']).toBe('token');const body=JSON.parse(options.body);expect(Object.keys(body)).toEqual(['attendanceDate','records']);expect(body.records[0]).toMatchObject({registrationId:2,status:'PRESENT',checkInAt:'2026-10-07T01:00:00.000Z',checkOutAt:null});
  for(const key of ['percentage','participantId','programId','recordedBy'])expect(body.records[0]).not.toHaveProperty(key);expect(doc.getElementById('pageMessage').textContent).toBe('Attendance saved successfully.');dom.window.close();
});
test('changed program cannot submit old roster',async()=>{
  const fetch=jest.fn(),dom=await page(fetch);dom.window.document.getElementById('programId').value='6';submit(dom);await tick();expect(fetch).not.toHaveBeenCalled();expect(dom.window.document.getElementById('pageMessage').textContent).toContain('selected program roster');dom.window.close();
});
test.each([400,401,403,404,500])('HTTP %i uses fixed safe error text and resets pending controls',async status=>{
  const dom=await page(async()=>({ok:false,status,json:async()=>({message:'SQL secret'})}));submit(dom);await tick();const doc=dom.window.document;expect(doc.getElementById('pageMessage').textContent).not.toContain('SQL');expect(doc.getElementById('pageMessage').classList.contains('alert-success')).toBe(false);expect(doc.getElementById('saveAttendance').disabled).toBe(false);dom.window.close();
});
test('duplicate submit is suppressed; malformed success and network errors do not claim success',async()=>{
  let resolve;const fetch=jest.fn(()=>new Promise(done=>{resolve=done;})),dom=await page(fetch);submit(dom);submit(dom);expect(fetch).toHaveBeenCalledTimes(1);resolve({ok:true,json:async()=>({items:[]})});await tick();expect(dom.window.document.getElementById('pageMessage').textContent).toContain('could not be confirmed');dom.window.close();
  const network=await page(async()=>{throw new Error('secret');});submit(network);await tick();expect(network.window.document.getElementById('pageMessage').textContent).toContain('could not be confirmed');network.window.close();
});
