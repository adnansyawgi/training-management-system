const express = require('../../src/node_modules/express');
const request = require('../../src/node_modules/supertest');
const path = require('node:path');
const ui = require('../../src/config/ui');
const navigation = require('../../src/services/navigation.service');
const { errors } = require('../../src/auth/authentication-errors');
const { makeSessionSecurity } = require('../../src/middleware/session-security');
const { makeProfileService } = require('../../src/services/profile.service');
const errorHandler = require('../../src/middleware/error-handler.middleware');
const correlation = require('../../src/middleware/correlation-id.middleware');
const token = 'c'.repeat(64);
let app, principal, sessions, connection, users, participants, audit, state;
beforeEach(() => {
  principal = {userId:'12', participantId:'34', role:'PARTICIPANT', csrfToken:token};
  state = {user:{user_id:'12',account_identifier:'P-own',username:'participant-own',name:'Own Name',email:'own@example.test',role_id:'PARTICIPANT',role_name:'PARTICIPANT',account_status:'ACTIVE',authentication_method:'PASSWORD'},participant:{participant_id:'34',user_id:'12',name:'Own Name',nric_passport_no:'TEST-123456',mobile_no:'0123456'}};
  connection = {beginTransaction:jest.fn(),commit:jest.fn(),rollback:jest.fn(),release:jest.fn()};
  sessions = {load:jest.fn(async () => principal),readId:jest.fn(() => 'current-session'),invalidate:jest.fn(async () => {principal=null;}),clearCookie:jest.fn(res => res.clearCookie('tms.sid',{path:'/',httpOnly:true,sameSite:'lax'}))};
  users = {findUserById:jest.fn(async () => ({...state.user})), updateUserProfileFields:jest.fn(async (_,id,fields) => {if(fields.email)state.user.email=fields.email;})};
  participants = {findParticipantByUserId:jest.fn(async () => state.participant?[{...state.participant}]:[]),updateParticipantProfileFields:jest.fn(async (_,id,fields) => {if(fields.mobileNo)state.participant.mobile_no=fields.mobileNo;})};
  audit = {profileUpdated:jest.fn(),csrfRejected:jest.fn()};
  const security = makeSessionSecurity({sessions,errors,audit});
  const service = makeProfileService({pool:{getConnection:async () => connection},users,participants,audit,errors});
  const bindings = {sessions,security,service,requestContext:req => ({correlationId:req.correlationId})};
  app = express();app.set('view engine','ejs');app.set('views',path.join(__dirname,'../../src/views'));
  app.use(correlation);app.use(express.json());app.use((req,res,next) => {res.locals.ui=ui;res.locals.navigationPolicy=navigation;next();});
  app.use(require('../../src/routes/home.routes'));app.use(require('../../src/routes/login.routes'));
  app.use(require('../../src/routes/dashboard.routes').makeRouter(bindings));
  app.use(require('../../src/routes/profile.routes').makeRouter(bindings));
  app.use(require('../../src/routes/logout.routes').makeRouter(bindings));app.use(errorHandler);
});
function role(value){principal.role=value;delete principal.participantId;state.user.role_id=value;state.user.role_name=value;state.user.account_identifier='A-own';state.participant=null;}
test('TC-CR-001 Home exposes only common login and Participant account creation', async () => {
  const result=await request(app).get('/').expect(200);
  expect(result.text).toContain('href="/login"');expect(result.text).toContain('href="/register"');
  expect(result.text).not.toMatch(/href="\/admin\/bootstrap"|System Administrator/);
});
test('TC-CR-002 common login has all account types and uses a single login module',async()=>{
  const result=await request(app).get('/login').expect(200);
  for(const value of ['participant','staff','system-admin'])expect(result.text).toContain(`value="${value}"`);
  expect(result.text).toContain('/js/login.js');expect(result.headers['set-cookie']).toBeUndefined();
});
test('TC-CR-003 Participant dashboard contains own navigation only',async()=>{
  const result=await request(app).get('/participant/dashboard').expect(200);
  for(const href of ['/programs','/registrations','/profile'])expect(result.text).toContain(`href="${href}"`);
  expect(result.text).toContain('data-logout');expect(result.text).not.toMatch(/href="\/(admin|trainer)\//);
  expect(result.headers['cache-control']).toBe('no-store');
});
test.each(['TRAINER','TRAINING_ADMINISTRATOR'])('TC-CR-005 %s gets own menu and cannot access System Administrator dashboard',async value=>{
  role(value);const result=await request(app).get('/staff/dashboard').expect(200);
  expect(result.text).toContain(value==='TRAINER'?'href="/trainer/programs"':'href="/admin/programs"');
  expect(result.text).not.toContain('href="/admin/users"');
  await request(app).get('/system-admin/dashboard').expect(403);
  await request(app).get('/participant/dashboard').expect(403);
});
test('System Administrator dashboard exposes existing administrative functions without bootstrap',async()=>{
  role('SYSTEM_ADMINISTRATOR');const result=await request(app).get('/system-admin/dashboard').expect(200);
  expect(result.text).toContain('href="/admin/users"');expect(result.text).not.toContain('href="/admin/bootstrap"');
  await request(app).get('/staff/dashboard').expect(403);
});
test('TC-CR-004 direct staff/System Administrator URLs deny Participant',async()=>{
  await request(app).get('/staff/dashboard').expect(403);await request(app).get('/system-admin/dashboard').expect(403);
});
test('TC-CR-006 logout invalidates only current session, clears cookie and rejects old access',async()=>{
  const result=await request(app).post('/api/v1/auth/logout').set('X-CSRF-Token',token).expect(204);
  expect(sessions.invalidate).toHaveBeenCalledWith('current-session');expect(result.headers['set-cookie'][0]).toContain('tms.sid=;');
  await request(app).get('/participant/dashboard').expect(401);
});
test.each(['/api/v1/auth/logout','/api/v1/profile'])('CSRF required for %s',async url=>{
  const operation=url.endsWith('profile')?request(app).put(url).send({email:'new@example.test'}):request(app).post(url);
  await operation.expect(403);expect(audit.csrfRejected).toHaveBeenCalledTimes(1);expect(sessions.invalidate).not.toHaveBeenCalled();expect(users.updateUserProfileFields).not.toHaveBeenCalled();
});
test('TC-CR-007 expiry prevents protected controller execution',async()=>{
  principal=null;await request(app).get('/api/v1/profile').expect(401);expect(users.findUserById).not.toHaveBeenCalled();
  const result=await request(app).post('/api/v1/auth/logout').expect(401);expect(result.headers['set-cookie'][0]).toContain('tms.sid=;');
});
test('TC-CR-008 Participant own profile masks NRIC and excludes security data',async()=>{
  const result=await request(app).get('/api/v1/profile?userId=99').expect(200);
  expect(result.body.userId).toBe(12);expect(result.body.profile.participantId).toBe(34);expect(result.body.editableFields).toEqual(['email','mobileNo']);
  expect(result.body.profile.nricPassportNo).toBe('*******3456');
  expect(JSON.stringify(result.body)).not.toMatch(/TEST-123456|password|csrf|permissions|accessScope|session/);
});
test.each(['TRAINER','TRAINING_ADMINISTRATOR','SYSTEM_ADMINISTRATOR'])('TC-CR-008 %s own profile has no invented mobile field',async value=>{
  role(value);const result=await request(app).get('/api/v1/profile').expect(200);
  expect(result.body.editableFields).toEqual(['email']);expect(result.body.profile.username).toBe('participant-own');expect(result.body.profile).not.toHaveProperty('mobileNo');
});
test.each(['userId','accountIdentifier','participantId','nricPassportNo','name','username','role','permissions','accessScope','accountStatus','passwordHash','sessionData','completed_at','updatedAt','createdAt','audit'])('TC-CR-009 protected field %s rejected before writes',async field=>{
  await request(app).put('/api/v1/profile').set('X-CSRF-Token',token).send({email:'new@example.test',[field]:'forged'}).expect(400);
  expect(connection.beginTransaction).not.toHaveBeenCalled();
});
test('TC-CR-010 own contact update normalizes email and commits with audit',async()=>{
  const result=await request(app).put('/api/v1/profile').set('X-CSRF-Token',token).send({email:' NEW@EXAMPLE.TEST ',mobileNo:' 0199999 '}).expect(200);
  expect(result.body.profile.email).toBe('new@example.test');expect(result.body.profile.mobileNo).toBe('0199999');
  expect(users.updateUserProfileFields).toHaveBeenCalledWith(connection,'12',{email:'new@example.test',mobileNo:'0199999'},expect.any(Date));
  expect(audit.profileUpdated.mock.invocationCallOrder[0]).toBeLessThan(connection.commit.mock.invocationCallOrder[0]);expect(connection.release).toHaveBeenCalled();
});
test.each([{},{email:'invalid'},{mobileNo:''},{mobileNo:'x'.repeat(31)}])('profile validation rejects %j',async body=>{
  await request(app).put('/api/v1/profile').set('X-CSRF-Token',token).send(body).expect(400);expect(connection.beginTransaction).not.toHaveBeenCalled();
});
test('Staff mobile mutation is prohibited',async()=>{role('TRAINER');await request(app).put('/api/v1/profile').set('X-CSRF-Token',token).send({mobileNo:'0123'}).expect(400);});
test('profile uniqueness conflict and mandatory audit failure roll back with safe errors',async()=>{
  users.updateUserProfileFields.mockRejectedValueOnce({wf001ConflictType:'PARTICIPANT_EMAIL_OR_NRIC'});
  await request(app).put('/api/v1/profile').set('X-CSRF-Token',token).send({email:'taken@example.test'}).expect(409);
  audit.profileUpdated.mockRejectedValueOnce(new Error('SQL private secret'));
  const result=await request(app).put('/api/v1/profile').set('X-CSRF-Token',token).send({email:'valid@example.test'}).expect(500);
  expect(JSON.stringify(result.body)).not.toMatch(/SQL|private|secret/);expect(connection.rollback).toHaveBeenCalledTimes(2);expect(connection.commit).not.toHaveBeenCalled();
});
