const express = require('../../src/node_modules/express');
const request = require('../../src/node_modules/supertest');
const { assemble } = require('../../src/composition/participant-program-registration.composition');
const { makeSessionSecurity } = require('../../src/middleware/session-security');
const { errors } = require('../../src/auth/authentication-errors');
const { makeErrorHandler } = require('../../src/middleware/implementation-errors');
let app, bindings, sessions;
const token = 'a'.repeat(64), principal = { userId: '1',participantId:'2',role:'PARTICIPANT',csrfToken:token }, connection = {};
beforeEach(() => {
  sessions = {load:jest.fn().mockResolvedValue(principal),readId:()=> 'session'};
  bindings = { transactions:{run:jest.fn(callback=>callback(connection))},repository:{
    lockParticipant:jest.fn().mockResolvedValue({participant_id:'2',email:'test@example.test'}),
    lockProgram:jest.fn().mockResolvedValue({program_id:'3'}),assertRegistration:jest.fn(),
    insert:jest.fn().mockResolvedValue({registrationId:'4',referenceNo:'R-test'}) },
    audit:{registrationCreated:jest.fn()},outbox:{enqueueConfirmation:jest.fn()},clock:{now:()=>new Date('2026-10-07T00:00:00Z')},
    requestContext:req=>({principal:req.principal,sessionId:req.authenticatedSessionId}) };
  bindings.security=makeSessionSecurity({sessions,errors,audit:{csrfRejected:jest.fn()}});
  app=express();app.use(express.json());app.use('/api/v1',assemble(bindings));app.use(makeErrorHandler([400,401,403,404,409,500]));
});
const register = body=>request(app).post('/api/v1/registrations').set('X-CSRF-Token',token).send(body || {programId:3});
test('exact five-field response and mandatory writes use the same transaction',async()=>{
  const result=await register().expect(201);
  expect(result.body).toEqual({registrationId:4,referenceNo:'R-test',programId:3,status:'REGISTERED',registeredAt:'2026-10-07T00:00:00.000Z'});
  expect(bindings.repository.lockParticipant.mock.invocationCallOrder[0]).toBeLessThan(bindings.repository.lockProgram.mock.invocationCallOrder[0]);
  expect(bindings.audit.registrationCreated.mock.calls[0][0]).toBe(connection);expect(bindings.outbox.enqueueConfirmation.mock.calls[0][0]).toBe(connection);
});
test.each([{}, {programId:'3'}, {programId:0},{programId:1.5},{programId:9007199254740992},
  {programId:3,participantId:2},{programId:3,name:'Injected'},{programId:3,email:'injected@example.test'},
  {programId:3,nricPassportNo:'secret'},{programId:3,mobileNo:'0123'},{programId:3,status:'REGISTERED'}])('rejects invalid/client-controlled body %j',async body=>{
  await register(body).expect(400);expect(bindings.transactions.run).not.toHaveBeenCalled();
});
test('unauthenticated requests fail before registration transaction',async()=>{sessions.load.mockResolvedValue(null);await register().expect(401);expect(bindings.transactions.run).not.toHaveBeenCalled();});
test.each(['SYSTEM_ADMINISTRATOR','TRAINING_ADMINISTRATOR','TRAINER'])('rejects %s role',async role=>{sessions.load.mockResolvedValue({...principal,role});await register().expect(403);});
test('CSRF failures reject before business writes',async()=>{await request(app).post('/api/v1/registrations').send({programId:3}).expect(403);expect(bindings.transactions.run).not.toHaveBeenCalled();});
test('non-visible program is 404',async()=>{bindings.repository.lockProgram.mockResolvedValue(null);await register().expect(404);expect(bindings.repository.insert).not.toHaveBeenCalled();});
test('business conflict returns 409',async()=>{bindings.repository.assertRegistration.mockRejectedValue(errors.conflict());await register().expect(409);expect(bindings.repository.insert).not.toHaveBeenCalled();});
test.each(['insert','audit','outbox','commit','unsafe-id'])('%s failure returns safe 500',async stage=>{
  const error=new Error('SQL password nric secret');
  if(stage==='insert')bindings.repository.insert.mockRejectedValue(error);
  if(stage==='audit')bindings.audit.registrationCreated.mockRejectedValue(error);
  if(stage==='outbox')bindings.outbox.enqueueConfirmation.mockRejectedValue(error);
  if(stage==='commit')bindings.transactions.run.mockImplementation(async callback=>{await callback(connection);throw error;});
  if(stage==='unsafe-id')bindings.repository.insert.mockResolvedValue({registrationId:'9007199254740993',referenceNo:'R-test'});
  const result=await register().expect(500);expect(JSON.stringify(result.body)).not.toMatch(/SQL|password|nric|secret/);
  if(stage==='unsafe-id')expect(bindings.audit.registrationCreated).not.toHaveBeenCalled();
});
