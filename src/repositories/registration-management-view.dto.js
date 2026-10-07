const { makeDto } = require('../utils/implementation-response');
const listFields = [
  ['registrationId','registration_id','id',false],
  ['referenceNo','reference_no','text',false],
  ['participantId','participant_id','id',false],
  ['programId','program_id','id',false],
  ['registeredAt','registered_at','instant',false],
  ['status','status','text',false],
  ['cancelledAt','cancelled_at','instant',true],
  ['cancellationReason','cancellation_reason','text',true]
];
function makeFeatureDto(codec) {
  const { project } = makeDto(codec);
  return {
    adminRegistrationList: row => project(row, listFields),
    adminRegistrationDetail: row => project(row, [...listFields, ['registrationRemarks','registration_remarks','text',true]])
  };
}
module.exports = { makeFeatureDto };
