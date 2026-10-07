function makeService(d){return {async issue(input,context){return d.transactions.run(async connection=>{
  await d.authorization.assertCreator(connection,context);
  const source=await d.repository.lockEligibility(connection,input.registrationId);
  if(!source?.attendance||Number(source.attendance.percentage)!==100)throw d.errors.validation();
  if(await d.repository.exists(connection,input.registrationId))throw d.errors.conflict();
  const eligibility=await d.rules.evaluate(source),now=d.clock.now();
  const row=await d.repository.insertWithReferenceRetry(connection,{
    ...input,participantId:source.registration.participant_id,programId:source.registration.program_id,...eligibility,
    attendancePercentage:100,issuedBy:context.principal.userId,certificateStatus:'ISSUED',issueDate:d.clock.businessDate(now),
    issuingAuthority:input.issuingAuthority??null,verificationReference:input.verificationReference??null,documentReference:input.documentReference??null
  },now);
  const result=d.dto.certificate(row);await d.audit.certificateIssued(connection,{row,context,now});return result;
});}};}
module.exports={makeService};
