const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ejs=require('../src/node_modules/ejs');
const {JSDOM}=require('../src/node_modules/jsdom');
const ui=require('../src/config/ui'),navigationPolicy=require('../src/services/navigation.service');
const token='a'.repeat(64);
let dom,document,window,fetchMock,navigate;
async function setup(view,locals,script){
  const filename=path.join(__dirname,'../src/views',view);
  const html=ejs.render(fs.readFileSync(filename,'utf8'),{...ui,ui,navigationPolicy,...locals},{filename});
  dom=new JSDOM(html,{url:'http://localhost/login'});document=dom.window.document;
  await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
  fetchMock=jest.fn();navigate=jest.fn();window={fetch:fetchMock,location:{href:'http://localhost/profile',origin:'http://localhost',assign:navigate}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/public/js',script),'utf8'),{window,document,fetch:(...args)=>window.fetch(...args),FormData:dom.window.FormData,URL});
  document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
}
async function submit(id){document.getElementById(id).dispatchEvent(new dom.window.Event('submit',{cancelable:true}));await new Promise(resolve=>setImmediate(resolve));}
afterEach(()=>dom?.window.close());
test.each([
 ['participant','PARTICIPANT','/api/v1/auth/participants/login','/participant/dashboard'],
 ['staff','TRAINER','/api/v1/auth/staff/login','/staff/dashboard'],
 ['staff','TRAINING_ADMINISTRATOR','/api/v1/auth/staff/login','/staff/dashboard'],
 ['system-admin','SYSTEM_ADMINISTRATOR','/api/v1/auth/system-admin/login','/system-admin/dashboard'],
 ['participant','TRAINER','/api/v1/auth/participants/login','/staff/dashboard']
])('TC-CR-002 %s dispatches to existing API and routes by server role %s',async(type,role,endpoint,destination)=>{
 await setup('auth/login.ejs',{},'login.js');
 document.getElementById('accountType').value=type;document.getElementById('email').value='user@example.test';document.getElementById('password').value='existing-password';
 fetchMock.mockResolvedValue({status:200,json:async()=>({role,status:'ACTIVE'})});await submit('loginForm');
 expect(fetchMock.mock.calls[0][0]).toBe(endpoint);expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({email:'user@example.test',password:'existing-password'});
 expect(navigate).toHaveBeenCalledWith(destination);expect(document.getElementById('password').value).toBe('');
});
test.each(['UNKNOWN','__proto__','constructor'])('unknown server role %s is denied',async role=>{
 await setup('auth/login.ejs',{},'login.js');document.getElementById('email').value='user@example.test';document.getElementById('password').value='password';
 fetchMock.mockResolvedValue({status:200,json:async()=>({role,status:'ACTIVE'})});await submit('loginForm');expect(navigate).not.toHaveBeenCalled();
});
test.each([400,401,423,500])('login %s shows fixed safe errors and accessible summary',async status=>{
 await setup('auth/login.ejs',{},'login.js');document.getElementById('email').value='user@example.test';document.getElementById('password').value='password';
 fetchMock.mockResolvedValue({status,json:async()=>({message:'SQL secret'})});await submit('loginForm');expect(document.getElementById('pageMessage').textContent).not.toMatch(/SQL|secret/);expect(document.activeElement.id).toBe('pageMessage');
});
test('required login fields prevent request and focus the invalid control',async()=>{
 await setup('auth/login.ejs',{},'login.js');await submit('loginForm');expect(fetchMock).not.toHaveBeenCalled();expect(document.activeElement.id).toBe('email');
});
test('TC-CR-010 profile submits server-rendered editable controls with CSRF only',async()=>{
 await setup('profile/profile.ejs',{principal:{role:'PARTICIPANT'},csrfToken:token,dashboardUrl:'/participant/dashboard',ownProfile:{userId:12,accountIdentifier:'P-id',role:'PARTICIPANT',profile:{participantId:34,nricPassportNo:'****1234',name:'<img> Own',email:'own@example.test',mobileNo:'0123',accountStatus:'ACTIVE'},editableFields:['email','mobileNo']}},'profile.js');
 expect(document.querySelector('input[name="name"]')).toBeNull();expect(document.querySelector('input[name="nricPassportNo"]')).toBeNull();expect(document.querySelector('dd img')).toBeNull();
 document.getElementById('email').value='new@example.test';fetchMock.mockResolvedValue({ok:true,status:200,json:async()=>({profile:{email:'new@example.test',mobileNo:'0123'},editableFields:['email','mobileNo']})});await submit('profileForm');
 expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({email:'new@example.test',mobileNo:'0123'});expect(fetchMock.mock.calls[0][1].headers['X-CSRF-Token']).toBe(token);
 expect(document.getElementById('profileMessage').textContent).toBe('Profile saved successfully.');
});
test('TC-CR-007/016 expired response blocks main content and traps focus with Logout only',async()=>{
 await setup('dashboard/participant.ejs',{principal:{role:'PARTICIPANT'},csrfToken:token,navigation:navigationPolicy.getMenu({role:'PARTICIPANT'})},'session.js');
 fetchMock.mockResolvedValueOnce({status:401});await window.fetch('/api/v1/profile');
 expect(document.getElementById('mainContent').inert).toBe(true);expect(document.getElementById('sessionExpiredModal').hidden).toBe(false);expect(document.activeElement.id).toBe('expiredSessionLogout');
 for(const key of ['Tab','Escape']){document.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));expect(document.activeElement.id).toBe('expiredSessionLogout');}
 await expect(window.fetch('/api/v1/profile')).rejects.toThrow('Session expired');expect(fetchMock).toHaveBeenCalledTimes(1);
 fetchMock.mockResolvedValueOnce({status:401});document.getElementById('expiredSessionLogout').click();await new Promise(resolve=>setImmediate(resolve));expect(navigate).toHaveBeenCalledWith('/');
 expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/auth/logout');expect(fetchMock.mock.calls[1][1].headers['X-CSRF-Token']).toBe(token);
});
test('session initial page denial opens modal without protected data',async()=>{
 await setup('session-expired.ejs',{sessionExpired:true},'session.js');expect(document.activeElement.id).toBe('expiredSessionLogout');expect(document.getElementById('mainContent').inert).toBe(true);
});
test('TC-CR-015/016 responsive navbar fallback works with keyboard-operable button',async()=>{
 await setup('home.ejs',{},'navigation.js');const toggle=document.querySelector('.navbar-toggler');expect(toggle.tagName).toBe('BUTTON');expect(toggle.getAttribute('aria-controls')).toBe('applicationNavigation');toggle.click();expect(toggle.getAttribute('aria-expanded')).toBe('true');expect(document.getElementById('applicationNavigation').classList.contains('show')).toBe(true);toggle.click();expect(toggle.getAttribute('aria-expanded')).toBe('false');
});
