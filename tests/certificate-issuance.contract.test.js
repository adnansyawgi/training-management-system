const {makeValidators}=require('../src/validators/certificate-eligibility-issuance.validator');
const {makeFeatureDto}=require('../src/repositories/certificate-eligibility-issuance.dto');
const {makeResponseCodec}=require('../src/utils/implementation-response-codec');
const {makeCertificateRules,businessDate}=require('../src/certificates/certificate-rules');
const {makeCertificateRepository}=require('../src/repositories/certificate-eligibility-issuance.repository');
const {errors}=require('../src/auth/authentication-errors');
const body=()=>({registrationId:1,certificateType:'COMPLETION',certificateTitle:'Completed course'});
function parse(input){const req={params:{},query:{},body:input};let failure;makeValidators({errors}).issue(req,{},error=>{failure=error;});if(failure)throw failure;return req.validatedInput;}
test('canonical numeric registration and optional nulls',()=>expect(parse({...body(),issuingAuthority:null})).toMatchObject({registrationId:'1',issuingAuthority:null}));
test.each(['percentage','eligibilityStatus','eligibilityResult','attendancePercentage','completionDate','participantId','programId','issuedBy','issueDate','certificateStatus','certificateNumber'])('rejects server-derived request field %s',key=>expect(()=>parse({...body(),[key]:'spoofed'})).toThrow());
test.each([{registrationId:'1'},{registrationId:9007199254740992},{certificateType:'x'.repeat(101)},{certificateTitle:'x'.repeat(256)},{issuingAuthority:'x'.repeat(256)},{verificationReference:'x'.repeat(256)},{documentReference:'x'.repeat(501)}])('physical limits and ID representation %j',change=>expect(()=>parse({...body(),...change})).toThrow());
test('rules derive completion from attendance; business issue date respects UTC midnight boundary',()=>{
  const rules=makeCertificateRules({errors}),source={registration:{status:'REGISTERED'},attendance:{status:'PRESENT',percentage:'100.00',attendance_date:'2026-10-06'}};
  expect(rules.evaluate(source)).toMatchObject({completionDate:'2026-10-06',eligibilityStatus:'ELIGIBLE'});
  expect(businessDate(new Date('2026-10-06T20:00:00Z'),'Asia/Kuala_Lumpur')).toBe('2026-10-07');
  expect(()=>rules.evaluate({...source,registration:{status:'CANCELLED'}})).toThrow();expect(()=>rules.evaluate({...source,attendance:{...source.attendance,status:'ABSENT'}})).toThrow();
});
test('exact seventeen-field DTO with lossless IDs, dates and percentage',()=>{
  const row={certificate_id:'1',certificate_number:'C-test',participant_id:'2',registration_id:'3',program_id:'4',certificate_type:'COMPLETION',certificate_title:'Title',eligibility_status:'ELIGIBLE',eligibility_result:'100% attendance achieved',attendance_percentage:'100.00',completion_date:'2026-10-06',issue_date:'2026-10-07',certificate_status:'ISSUED',document_reference:null,verification_reference:null,issuing_authority:null,issued_by:'5',password_hash:'secret'};
  const dto=makeFeatureDto(makeResponseCodec());expect(Object.keys(dto.certificate(row))).toHaveLength(17);expect(dto.certificate(row).attendancePercentage).toBe(100);expect(dto.certificate(row)).not.toHaveProperty('password_hash');expect(()=>dto.certificate({...row,certificate_id:'9007199254740992'})).toThrow();
});
test('only generated reference collisions retry; registration collisions are 409; exhaustion fails closed',async()=>{
  const input={...body(),participantId:2,programId:4,eligibilityStatus:'ELIGIBLE',eligibilityResult:'100% attendance achieved',attendancePercentage:100,completionDate:'2026-10-06',issueDate:'2026-10-07',certificateStatus:'ISSUED',issuedBy:5,documentReference:null,verificationReference:null,issuingAuthority:null};
  const duplicate=key=>Object.assign(new Error('fixture'),{code:'ER_DUP_ENTRY',sqlMessage:"Duplicate entry 'fixture' for key 'certificates."+key+"'"});
  const reference=jest.fn(()=> 'C-test'),connection={execute:jest.fn().mockRejectedValueOnce(duplicate('certificate_number')).mockResolvedValueOnce([{}]).mockResolvedValueOnce([[{certificate_id:1}]])};
  const repo=makeCertificateRepository({pool:{},errors,reference,attempts:3});await repo.insertWithReferenceRetry(connection,input,new Date());expect(reference).toHaveBeenCalledTimes(2);
  connection.execute=jest.fn().mockRejectedValue(duplicate('registration_id'));await expect(repo.insertWithReferenceRetry(connection,input,new Date())).rejects.toMatchObject({status:409});expect(connection.execute).toHaveBeenCalledTimes(1);
  connection.execute=jest.fn().mockRejectedValue(duplicate('certificate_number'));await expect(repo.insertWithReferenceRetry(connection,input,new Date())).rejects.toMatchObject({code:'ER_DUP_ENTRY'});expect(connection.execute).toHaveBeenCalledTimes(3);
});
