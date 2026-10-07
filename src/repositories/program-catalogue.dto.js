const { makeDto } = require('../utils/implementation-response');
function makeFeatureDto(codec) {
  const { project } = makeDto(codec);
  return { programList: row => project(row, [
    ['programId', 'program_id', 'id', false],
    ['code', 'code', 'text', false], ['name', 'name', 'text', false],
    ['categoryId', 'category_id', 'id', false], ['categoryName', 'category_name', 'text', false],
    ['trainingDate', 'training_date', 'day', false],
    ['startTime', 'start_time', 'time', false], ['endTime', 'end_time', 'time', false],
    ['venue', 'venue', 'text', true], ['deliveryMode', 'delivery_mode', 'text', false],
    ['capacity', 'capacity', 'number', false], ['availableSeats', 'available_seats', 'number', false],
    ['status', 'status', 'text', false],
    ['registrationOpenAt', 'registration_open_at', 'instant', false],
    ['registrationCloseAt', 'registration_close_at', 'instant', false]
  ]) };
}
module.exports = { makeFeatureDto };
