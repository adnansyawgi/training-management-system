const {day}=require('../validators/implementation-validation');
function makeCertificateRules({errors}){return {evaluate(source){
  if(source.registration.status!=='REGISTERED'||source.attendance.status!=='PRESENT'||Number(source.attendance.percentage)!==100)throw errors.validation();
  return {eligibilityStatus:'ELIGIBLE',eligibilityResult:'100% attendance achieved',completionDate:day(source.attendance.attendance_date)};
}};}
function businessDate(now,timezone){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
  return day(parts.year+'-'+parts.month+'-'+parts.day);
}
module.exports={makeCertificateRules,businessDate};
