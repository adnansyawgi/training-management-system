const {makeDto}=require('../utils/implementation-response');
function makeFeatureDto(codec){const {project}=makeDto(codec);return {attendance:row=>project(row,[
  ['attendanceId','attendance_id','id',false],['registrationId','registration_id','id',false],['participantId','participant_id','id',false],
  ['programId','program_id','id',false],['attendanceDate','attendance_date','day',false],['status','status','text',false],
  ['percentage','percentage','number',false],['recordedBy','recorded_by','id',false]
])};}
module.exports={makeFeatureDto};
