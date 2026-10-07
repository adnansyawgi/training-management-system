const {makeDto}=require('../utils/implementation-response');
const fields=[['certificateId','certificate_id','id',false],['certificateNumber','certificate_number','text',false],
  ['participantId','participant_id','id',false],['registrationId','registration_id','id',false],['programId','program_id','id',false],
  ['certificateType','certificate_type','text',false],['certificateTitle','certificate_title','text',false],
  ['eligibilityStatus','eligibility_status','text',false],['eligibilityResult','eligibility_result','text',false],
  ['attendancePercentage','attendance_percentage','number',false],['completionDate','completion_date','day',false],
  ['issueDate','issue_date','day',false],['certificateStatus','certificate_status','text',false],
  ['documentReference','document_reference','text',true],['verificationReference','verification_reference','text',true],
  ['issuingAuthority','issuing_authority','text',true],['issuedBy','issued_by','id',false]];
function makeFeatureDto(codec){const {project}=makeDto(codec);return {certificate:row=>project(row,fields)};}
module.exports={makeFeatureDto,fields};
