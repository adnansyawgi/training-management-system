const v = require('./implementation-validation');
function safeId(value) {
  const id=v.positiveId(value);if(!Number.isSafeInteger(Number(id)))throw v.bad();return id;
}
function makeValidators({errors}) {
  const record=v.schema({registrationId:value=>{if(typeof value!=='number')throw v.bad();return safeId(value);},
    status:v.member(['PRESENT','ABSENT']),checkInAt:value=>value===null?null:v.instant(value),checkOutAt:value=>value===null?null:v.instant(value),
    verificationMethod:v.nullableText(50),evidenceReference:v.nullableText(255),remarks:v.nullableText(500)},['registrationId','status']);
  return {record:v.middleware(req=>{
    v.object(req.params,['programId']);v.object(req.query,[]);
    const input=v.schema({attendanceDate:v.day,records:values=>{
      if(!Array.isArray(values))throw v.bad();const records=values.map(record);
      if(new Set(records.map(row=>row.registrationId)).size!==records.length)throw v.bad();return records;
    }},['attendanceDate','records'])(req.body);
    return {programId:safeId(req.params.programId),...input};
  },errors)};
}
module.exports={makeValidators};
