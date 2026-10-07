const { makeDto } = require('../utils/implementation-response');
function makeFeatureDto(codec) {
  const { project } = makeDto(codec);
  return { ownRegistrationList: row => project(row, [
    ['registrationId','registration_id','id',false], ['referenceNo','reference_no','text',false],
    ['programId','program_id','id',false], ['programCode','program_code','text',false], ['programName','program_name','text',false],
    ['trainingDate','training_date','day',false], ['startTime','start_time','time',false], ['endTime','end_time','time',false],
    ['registeredAt','registered_at','instant',false], ['status','status','text',false],
    ['cancelledAt','cancelled_at','instant',true], ['cancellationReason','cancellation_reason','text',true]
  ]) };
}
module.exports = { makeFeatureDto };
