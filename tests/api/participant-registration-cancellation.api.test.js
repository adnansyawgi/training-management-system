const express=require('../../src/node_modules/express'),request=require('../../src/node_modules/supertest');
const {assemble}=require('../../src/participant-registration-cancellation.composition');
const {makeSessionSecurity}=require('../../src/middleware/session-security');
const {errors}=require('../../src/auth/authentication-errors');const {makeErrorHandler}=require('../../src/middleware/implementation-errors');
let app,bindings,sessions;
const token='a'.repeat(64),principal={userId:'1',participantId:'2',role:'PARTICIPANT',csrfToken:token};
const row={registration_id:'4',reference_no:'R-test',program_id:'3',program_code:'P-3',program_name:'Program',training_date:'2026-12-01',start_time:'09:00:00',end_time:'10:00:00',registered_at:'2026-10-07 00:00:00',status:'REGISTERED',cancelled_at:null,cancellation_reason:null};
beforeEach(()=>{
  sessions={load:jest.fn().mockResolvedValue(principal),readId:()=> 'session'};
  bindings={transactions:{run:jest.fn(callback=>callback({}))},repository:{readOwnPage:jest.fn().mockResolvedValue({rows:[row],total:1}),lockMutation:jest.fn().mockResolvedValue(row),cancel:jest.fn().mockResolvedValue(1)},rules:{beforeProgramStart:jest.fn().mockReturnValue(true)},audit:{registrationCancelled:jest.fn()},clock:{now:()=>new Date('2026-10-07T00:00:00Z')},configuration:require('../../src/config/registration-cancellation'),requestContext:req=>({principal:req.principal,sessionId:req.authenticatedSessionId})};
  bindings.security=makeSessionSecurity({sessions,errors,audit:{csrfRejected:jest.fn()}});app=express();app.use(express.json());app.use('/api/v1',assemble(bindings));app.use(makeErrorHandler([400,401,403,404,500]));
});
const cancel=body=>request(app).post('/api/v1/registrations/4/cancel').set('X-CSRF-Token',token).send(body||{});
test('list returns exact 12 fields and uses session identity only',async()=>{
  const result=await request(app).get('/api/v1/registrations').expect(200);expect(Object.keys(result.body.items[0])).toHaveLength(12);
  expect(result.body.items[0]).toMatchObject({registrationId:4,programId:3,cancelledAt:null});expect(bindings.repository.readOwnPage).toHaveBeenCalledWith('1',{page:1,pageSize:20,sort:'REGISTERED_AT_DESC'});
});
test('cancel returns exact four fields and invokes audit',async()=>{const result=await cancel({cancellationReason:'  Changed plans  '}).expect(200);expect(result.body).toEqual({registrationId:4,referenceNo:'R-test',status:'CANCELLED',cancelledAt:'2026-10-07T00:00:00.000Z'});expect(bindings.repository.cancel).toHaveBeenCalledWith({},'4','2',expect.any(Date),'Changed plans');expect(bindings.audit.registrationCancelled).toHaveBeenCalled();});
test.each(['participantId=2','name=X','email=x','sort=DROP%20TABLE','status=OPEN','page=0','pageSize=101','sort=','status=','page=1&page=2'])('invalid list query %s rejects before repository',async query=>{await request(app).get('/api/v1/registrations?'+query).expect(400);expect(bindings.repository.readOwnPage).not.toHaveBeenCalled();});
test.each([{participantId:2},{status:'CANCELLED'},{cancellationReason:'x'.repeat(501)},{cancellationReason:12}])('invalid cancellation %j rejects before writes',async body=>{await cancel(body).expect(400);expect(bindings.transactions.run).not.toHaveBeenCalled();});
test('anonymous and disallowed role requests are rejected',async()=>{sessions.load.mockResolvedValueOnce(null);await cancel().expect(401);sessions.load.mockResolvedValueOnce({...principal,role:'TRAINER'});await cancel().expect(403);});
test('ownership and missing registration use 403 and 404',async()=>{bindings.repository.lockMutation.mockRejectedValueOnce(errors.forbidden());await cancel().expect(403);bindings.repository.lockMutation.mockResolvedValueOnce(null);await cancel().expect(404);});
test.each(['status','time','no-change'])('%s non-cancellable registration returns 400 without audit',async reason=>{if(reason==='status')bindings.repository.lockMutation.mockResolvedValue({...row,status:'CANCELLED'});if(reason==='time')bindings.rules.beforeProgramStart.mockReturnValue(false);if(reason==='no-change')bindings.repository.cancel.mockResolvedValue(0);await cancel().expect(400);expect(bindings.audit.registrationCancelled).not.toHaveBeenCalled();});
test('audit failure returns safe 500',async()=>{bindings.audit.registrationCancelled.mockRejectedValue(new Error('SQL secret'));const result=await cancel().expect(500);expect(JSON.stringify(result.body)).not.toMatch(/SQL|secret/);});
test('unsafe response ID fails before mutation',async()=>{bindings.repository.lockMutation.mockResolvedValue({...row,registration_id:'9007199254740993'});await cancel().expect(500);expect(bindings.repository.cancel).not.toHaveBeenCalled();});
test('missing CSRF rejects cancellation before transaction',async()=>{await request(app).post('/api/v1/registrations/4/cancel').send({}).expect(403);expect(bindings.transactions.run).not.toHaveBeenCalled();});
