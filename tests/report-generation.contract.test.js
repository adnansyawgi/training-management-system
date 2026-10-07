const {makeValidators}=require('../src/validators/report-generation.validator');
const {errors}=require('../src/auth/authentication-errors');
const csv=require('../src/reports/csv'),definitions=require('../src/reports/report-definitions');
const {certificateDayBound}=require('../src/reports/business-period');
const {makeFeatureDto}=require('../src/repositories/report-generation.dto');
const {makeResponseCodec}=require('../src/utils/implementation-response-codec');
const period=()=>({periodFrom:'2026-10-06T16:00:00Z',periodTo:'2026-10-07T16:00:00Z'});
function parse(type,query){const req={query,params:{}};let failure;makeValidators({errors})[type](req,{},error=>{failure=error;});if(failure)throw failure;return req.validatedInput;}
test('exactly three reports, JSON default, equal period valid and bounded pagination',()=>{
  expect(Object.keys(definitions)).toEqual(['certificates','registrations','accounts']);expect(parse('accounts',period())).toMatchObject({output:'json',page:1,pageSize:20});expect(parse('accounts',{...period(),periodTo:period().periodFrom})).toMatchObject({output:'json'});
});
test.each([{periodFrom:undefined},{pageSize:'101'},{page:'0'},{participantId:'9007199254740992'},{output:'pdf'},{sort:'name'},{accountStatus:'PENDING'},{programId:'1'},{participantId:['1','2']},{periodTo:'2026-02-30T00:00:00Z'}])('account query invalid %j',change=>expect(()=>parse('accounts',{...period(),...change})).toThrow());
test('endpoint-specific statuses and filters cannot cross report types',()=>{
  expect(()=>parse('certificates',{...period(),status:'REGISTERED'})).toThrow();expect(()=>parse('certificates',{...period(),certificateStatus:'REVOKED'})).toThrow();expect(()=>parse('registrations',{...period(),certificateStatus:'ISSUED'})).toThrow();
});
test('business-local midnight bounds handle fractional-day periods',()=>{
  expect(certificateDayBound('2026-10-06T16:00:00Z','Asia/Kuala_Lumpur')).toBe('2026-10-07');expect(certificateDayBound('2026-10-06T16:00:01Z','Asia/Kuala_Lumpur')).toBe('2026-10-08');expect(certificateDayBound('2026-10-07T16:00:00Z','Asia/Kuala_Lumpur')).toBe('2026-10-08');
});
test('CSV fixed order, RFC-style quotes/newlines and spreadsheet formula guards',()=>{
  const output=csv.encode([['First','first'],['Second','second']],[{first:' =SUM(A1)',second:'comma,quote"\nline'},{first:'@attack',second:null}]);expect(output).toBe('"First","Second"\r\n"\' =SUM(A1)","comma,quote""\nline"\r\n"\'@attack",""\r\n');expect(()=>csv.encode([['A','a']],[{}])).toThrow();
});
test('account DTO exact eight columns excludes NRIC and handles staff nulls',()=>{
  const result=makeFeatureDto(makeResponseCodec()).accounts({participant_id:null,name:'Staff',email:'staff@example.test',mobile_no:null,account_status:'ACTIVE',created_at:'2026-10-07 00:00:00',created_by:'A-creator',last_login_at:null,nric_passport_no:'SECRET'});
  expect(Object.keys(result)).toHaveLength(8);expect(result).toMatchObject({participantId:null,mobileNo:null,createdBy:'A-creator'});expect(JSON.stringify(result)).not.toContain('SECRET');
});
