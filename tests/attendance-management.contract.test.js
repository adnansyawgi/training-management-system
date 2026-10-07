const {makeValidators}=require('../src/validators/attendance-management.validator');
const {makeFeatureDto}=require('../src/repositories/attendance-management.dto');
const {makeResponseCodec}=require('../src/utils/implementation-response-codec');
const {makeService}=require('../src/services/attendance-management.service');
const {errors}=require('../src/auth/authentication-errors');
function parse(body,programId='1'){const req={body,params:{programId},query:{}};let error;makeValidators({errors}).record(req,{},e=>{error=e;});if(error)throw error;return req.validatedInput;}
const payload=()=>({attendanceDate:'2026-10-07',records:[{registrationId:2,status:'PRESENT'}]});
test('strict fields, canonical numeric targets, offset normalization and empty batch per source',()=>{
  expect(parse(payload()).records[0].registrationId).toBe('2');expect(parse({...payload(),records:[]})).toMatchObject({records:[]});
  const body=payload();body.records[0].checkInAt='2026-10-07T09:00:00+08:00';expect(parse(body).records[0].checkInAt).toBe('2026-10-07T01:00:00.000Z');
});
test.each([{percentage:75},{participantId:9},{programId:1},{recordedBy:8},{status:'LATE'},{registrationId:'2'},{registrationId:9007199254740992},{remarks:'x'.repeat(501)},{verificationMethod:'x'.repeat(51)},{evidenceReference:'x'.repeat(256)},{checkInAt:'2026-02-30T00:00:00Z'}])('invalid record rejected %j',change=>{const body=payload();Object.assign(body.records[0],change);expect(()=>parse(body)).toThrow();});
test('duplicate targets, unknown batch fields and unsafe path IDs rejected',()=>{
  expect(()=>parse({...payload(),records:[{registrationId:2,status:'PRESENT'},{registrationId:2,status:'ABSENT'}]})).toThrow();
  expect(()=>parse({...payload(),percentage:1})).toThrow();expect(()=>parse(payload(),'9007199254740992')).toThrow();
});
test('exact eight-field DTO with business date and numeric decimal percentage',()=>{
  const dto=makeFeatureDto(makeResponseCodec()).attendance({attendance_id:'1',registration_id:'2',participant_id:'3',program_id:'4',attendance_date:'2026-10-07',status:'PRESENT',percentage:'100.00',recorded_by:'5',remarks:'private'});
  expect(Object.keys(dto)).toHaveLength(8);expect(dto.percentage).toBe(100);expect(dto).not.toHaveProperty('remarks');
});
test('server derives relationship fields, actor and percentage and audits on same connection',async()=>{
  const connection={},context={principal:{userId:'5'}},row={};
  const d={errors,transactions:{run:async fn=>fn(connection)},authorization:{assertCreator:jest.fn()},repository:{lockProgram:async()=>({trainer_user_id:'5'}),lockBatch:async()=>new Map([['2',{participant_id:'3',program_id:'1',status:'REGISTERED'}]]),findForUpdate:async()=>null,save:jest.fn(async()=>row)},dto:{attendance:()=>({attendanceId:7})},audit:{attendanceChanged:jest.fn()},clock:{now:()=>new Date('2026-10-07T00:00:00Z')}};
  const service=makeService(d);await service.record(parse(payload()),context);expect(d.repository.save.mock.calls[0][2]).toMatchObject({participantId:'3',programId:'1',recordedBy:'5',percentage:100});expect(d.audit.attendanceChanged.mock.calls[0][0]).toBe(connection);
  const body=payload();body.records[0].status='ABSENT';await service.record(parse(body),context);expect(d.repository.save.mock.calls[1][2].percentage).toBe(0);
});
