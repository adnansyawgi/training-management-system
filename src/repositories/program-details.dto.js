const { makeDto } = require('../utils/implementation-response');
function makeFeatureDto(codec) {
  const { project } = makeDto(codec);
  return { programDetail: row => project(row, fields) };
}
const fields = [
    ['programId', 'program_id', 'id', false],
    ['code', 'code', 'text', false], ['name', 'name', 'text', false],
    ['categoryId', 'category_id', 'id', false], ['categoryName', 'category_name', 'text', false],
    ['trainingDate', 'training_date', 'day', false],
    ['startTime', 'start_time', 'time', false], ['endTime', 'end_time', 'time', false],
    ['venue', 'venue', 'text', true], ['deliveryMode', 'delivery_mode', 'text', false],
    ['capacity', 'capacity', 'number', false], ['availableSeats', 'available_seats', 'number', false],
    ['status', 'status', 'text', false],
    ['registrationOpenAt', 'registration_open_at', 'instant', false],
    ['registrationCloseAt', 'registration_close_at', 'instant', false],
    ['description', 'description', 'text', false], ['objectives', 'objectives', 'text', false],
    ['targetAudience', 'target_audience', 'text', false], ['prerequisites', 'prerequisites', 'text', true],
    ['trainerName', 'trainer_name', 'text', false],
    ['cancellationPolicyReference', 'cancellation_policy_reference', 'text', true],
    ['certificateEligibilityCriteria', 'certificate_eligibility_criteria', 'text', false],
    ['certificateType', 'certificate_type', 'text', true],
    ['createdAt', 'created_at', 'instant', false], ['updatedAt', 'updated_at', 'instant', false]
];
module.exports = { makeFeatureDto, fields };
