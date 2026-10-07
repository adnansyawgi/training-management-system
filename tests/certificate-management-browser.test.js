const {JSDOM}=require('../src/node_modules/jsdom'),ejs=require('../src/node_modules/ejs');
const fs=require('fs'),path=require('path'),ui=require('../src/config/ui');
const success={certificateId:1,certificateNumber:'C-<script>technical',participantId:2,registrationId:3,programId:4,certificateType:'COMPLETION',certificateTitle:'Title',eligibilityStatus:'ELIGIBLE',eligibilityResult:'100% attendance achieved',attendancePercentage:100,completionDate:'2026-10-06',issueDate:'2026-10-07',certificateStatus:'ISSUED',documentReference:null,verificationReference:null,issuingAuthority:null,issuedBy:5};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function page(fetch){
  const html=ejs.render(fs.readFileSync(path.join(__dirname,'../src/views/admin/certificate-management.ejs'),'utf8'),{...ui,csrfToken:'token',selected:{programId:4},programs:[{programId:4,name:'<img> Program',code:'CODE'},{programId:6,name:'Other',code:'OTHER'}],eligibleRegistrations:[{registrationId:3,referenceNo:'R-<script>',participantName:'<img> Name',completionDate:'2026-10-06'}],page:1,programPage:1,programTotal:2,total:1,link:()=>'/admin/certificates'});
  const dom=new JSDOM(html,{url:'http://localhost/admin/certificates?programId=4',runScripts:'outside-only'});await new Promise(resolve=>dom.window.document.addEventListener('DOMContentLoaded',resolve,{once:true}));dom.window.fetch=fetch;
  dom.window.eval(fs.readFileSync(path.join(__dirname,'../src/public/js/certificate-management.js'),'utf8'));dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  const doc=dom.window.document;doc.getElementById('registrationId').value='3';doc.getElementById('registrationId').dispatchEvent(new dom.window.Event('change'));doc.getElementById('certificateType').value='COMPLETION';doc.getElementById('certificateTitle').value='Title';return dom;
}
function submit(dom){dom.window.document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));}
test('only six documented request fields and CSRF; completion read-only; technical reference rendered safely',async()=>{
  const fetch=jest.fn(async()=>({ok:true,status:201,json:async()=>success})),dom=await page(fetch),doc=dom.window.document;
  expect(doc.getElementById('completionDate').readOnly).toBe(true);expect(doc.getElementById('completionDate').value).toBe('2026-10-06');expect(doc.querySelector('option img')).toBeNull();submit(dom);await tick();
  const [url,options]=fetch.mock.calls[0];expect(url).toBe('/api/v1/admin/certificates');expect(options.headers['X-CSRF-Token']).toBe('token');const body=JSON.parse(options.body);expect(Object.keys(body)).toHaveLength(6);expect(body).toMatchObject({registrationId:3,certificateType:'COMPLETION'});
  for(const key of ['programId','participantId','completionDate','issuedBy','certificateNumber','attendancePercentage'])expect(body).not.toHaveProperty(key);expect(doc.getElementById('pageMessage').textContent).toContain('C-<script>technical');expect(doc.querySelector('#pageMessage script')).toBeNull();expect(doc.querySelector('option[value="3"]')).toBeNull();dom.window.close();
});
test('changed program cannot submit old eligibility selection',async()=>{
  const fetch=jest.fn(),dom=await page(fetch);dom.window.document.getElementById('programId').value='6';submit(dom);await tick();expect(fetch).not.toHaveBeenCalled();expect(dom.window.document.getElementById('pageMessage').textContent).toContain('selected program eligibility');dom.window.close();
});
test.each([400,401,403,409,500])('HTTP %i fixed text and safe retry controls',async status=>{
  const dom=await page(async()=>({ok:false,status,json:async()=>({message:'SQL secret <script>'})}));submit(dom);await tick();const doc=dom.window.document;expect(doc.getElementById('pageMessage').textContent).not.toMatch(/SQL|secret/);expect(doc.getElementById('pageMessage').classList.contains('alert-success')).toBe(false);expect(doc.getElementById('issueCertificate').disabled).toBe(false);dom.window.close();
});
test('pending submissions suppressed and malformed/network success does not claim issuance',async()=>{
  let resolve;const fetch=jest.fn(()=>new Promise(done=>{resolve=done;})),dom=await page(fetch);submit(dom);submit(dom);expect(fetch).toHaveBeenCalledTimes(1);expect(dom.window.document.getElementById('cancelCertificate').disabled).toBe(true);resolve({ok:true,status:201,json:async()=>({certificateId:1})});await tick();expect(dom.window.document.getElementById('pageMessage').textContent).toContain('could not be confirmed');dom.window.close();
  const network=await page(async()=>{throw new Error('secret');});submit(network);await tick();expect(network.window.document.getElementById('pageMessage').textContent).toContain('could not be confirmed');network.window.close();
});
