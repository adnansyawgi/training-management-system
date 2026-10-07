const { makeValidators } = require('../src/validators/registration-management-view.validator');
const { makeFeatureDto } = require('../src/repositories/registration-management-view.dto');
const { makeService } = require('../src/services/registration-management-view.service');
const { makeResponseCodec } = require('../src/utils/implementation-response-codec');
const { errors } = require('../src/auth/authentication-errors');
const validators = makeValidators({ errors, sortKeys:['TEST_SORT'], defaultSort:'TEST_SORT' });
function parse(method,query={},params={},body) {
  const req={query,params,body};let failure;
  validators[method](req,{},error=>{failure=error;});
  if(failure)throw failure;return req.validatedInput;
}
const row={registration_id:'1',reference_no:'R-test',participant_id:'2',program_id:'3',registered_at:'2026-10-07 01:00:00',status:'REGISTERED',cancelled_at:null,cancellation_reason:null,registration_remarks:'Detail only',password_hash:'secret',nric_passport_no:'private'};
test('exact eight list and nine detail fields with UTC/null handling',()=>{
  const dto=makeFeatureDto(makeResponseCodec());expect(Object.keys(dto.adminRegistrationList(row))).toHaveLength(8);expect(Object.keys(dto.adminRegistrationDetail(row))).toHaveLength(9);
  expect(dto.adminRegistrationList(row)).toMatchObject({registrationId:1,registeredAt:'2026-10-07T01:00:00.000Z',cancelledAt:null});
  expect(JSON.stringify(dto.adminRegistrationDetail(row))).not.toMatch(/private|secret/);
});
test.each(['9007199254740992','0','01','1.2','-1','1 OR 1=1'])('rejects unsafe/noncanonical identity %s',id=>{
  expect(()=>parse('list',{programId:id})).toThrow();expect(()=>parse('detail',{}, {registrationId:id})).toThrow();
});
test.each([{pageSize:'101'},{page:'0'},{sort:'DROP TABLE registrations'},{status:'APPROVED'},{role:'TRAINING_ADMINISTRATOR'},{programId:['1','2']},{periodFrom:'2026-02-30T00:00:00Z'},{periodFrom:'2026-10-07T01:00:00Z',periodTo:'2026-10-07T00:00:00Z'},{periodFrom:'2026-10-07T00:00:00Z',periodTo:'2026-10-07T00:00:00Z'}])('rejects invalid query %j',query=>expect(()=>parse('list',query)).toThrow());
test('normalizes explicit offsets and bounds pagination',()=>{
  expect(parse('list',{periodFrom:'2026-10-07T09:00:00+08:00',participantId:'3',pageSize:'100'})).toMatchObject({periodFrom:'2026-10-07T01:00:00.000Z',participantId:'3',pageSize:100});
  expect(()=>parse('detail',{page:'1'},{registrationId:'1'})).toThrow();expect(()=>parse('list',{}, {},{role:'TRAINER'})).toThrow();
});
test('DTO fails closed on unrepresentable output identity',()=>{
  expect(()=>makeFeatureDto(makeResponseCodec()).adminRegistrationList({...row,registration_id:'9007199254740992'})).toThrow();
});
test('list and detail derive the same scope; missing detail is trusted 404',async()=>{
  const scope=Object.freeze({scope:'test'}),principal={userId:'10'};
  const d={errors,dto:makeFeatureDto(makeResponseCodec()),authorization:{operationalScope:jest.fn(async()=>scope)},registrations:{adminPage:jest.fn(async()=>({rows:[row],total:1})),adminDetail:jest.fn(async()=>row)}};
  const service=makeService(d),input={page:1,pageSize:20};expect((await service.list(input,{principal})).total).toBe(1);
  await service.detail({registrationId:'1'},{principal});expect(d.registrations.adminPage).toHaveBeenCalledWith(input,scope);expect(d.registrations.adminDetail).toHaveBeenCalledWith('1',scope);
  d.registrations.adminDetail.mockResolvedValue(null);await expect(service.detail({registrationId:'2'},{principal})).rejects.toMatchObject({status:404});
});
