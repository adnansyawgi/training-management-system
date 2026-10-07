const {sameId}=require('../validators/implementation-validation');
function makeService(d){return {async record(input,context){return d.transactions.run(async connection=>{
  await d.authorization.assertCreator(connection,context);
  const program=await d.repository.lockProgram(connection,input.programId);
  if(!program){ throw d.errors.notFound(); }if(!sameId(program.trainer_user_id,context.principal.userId)){ throw d.errors.forbidden(); }
  const registrations=await d.repository.lockBatch(connection,input.records.map(row=>row.registrationId));
  for(const entry of input.records){const registration=registrations.get(entry.registrationId);
    if(!registration){ throw d.errors.notFound(); }
    if(!sameId(registration.program_id,input.programId)||registration.status!=='REGISTERED'){ throw d.errors.validation(); }
  }
  const previous=new Map();
  for(const entry of [...input.records].sort((a,b)=>BigInt(a.registrationId)<BigInt(b.registrationId)?-1:1)){
    previous.set(entry.registrationId,await d.repository.findForUpdate(connection,entry.registrationId));
  }
  const items=[],now=d.clock.now();
  for(const entry of input.records){const registration=registrations.get(entry.registrationId),before=previous.get(entry.registrationId);
    if(before&&(!sameId(before.participant_id,registration.participant_id)||!sameId(before.program_id,registration.program_id))){ throw d.errors.integrity(); }
    const row=await d.repository.save(connection,before,{...entry,participantId:registration.participant_id,programId:registration.program_id,
      attendanceDate:input.attendanceDate,percentage:entry.status==='PRESENT'?100:0,recordedBy:context.principal.userId},now);
    const projected=d.dto.attendance(row);
    await d.audit.attendanceChanged(connection,{before,row,context,now});items.push(projected);
  }
  return {items};
});}};}
module.exports={makeService};
