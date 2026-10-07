const { publicProgramPredicate } = require('./public-program-policy');
function makeProgramDetailsRepository({ pool }) {
  return { async findPublicDetail(programId) {
    // One SELECT gives detail and authoritative seat count from the same snapshot.
    const [rows] = await pool.execute(`SELECT p.program_id, p.code, p.name, p.description, p.objectives,
      p.target_audience, p.prerequisites, p.category_id, c.name AS category_name, u.name AS trainer_name,
      DATE_FORMAT(p.training_date, '%Y-%m-%d') AS training_date,
      TIME_FORMAT(p.start_time, '%H:%i:%s') AS start_time, TIME_FORMAT(p.end_time, '%H:%i:%s') AS end_time,
      p.venue, p.delivery_mode, p.capacity,
      p.capacity - (SELECT COUNT(*) FROM registrations r WHERE r.program_id = p.program_id AND r.status = 'REGISTERED') AS available_seats,
      p.status, p.registration_open_at, p.registration_close_at, p.cancellation_policy_reference,
      p.certificate_eligibility_criteria, p.certificate_type, p.created_at, p.updated_at
      FROM training_programs p JOIN program_categories c ON c.category_id = p.category_id
      JOIN users u ON u.user_id = p.trainer_user_id
      WHERE p.program_id = ? AND ${publicProgramPredicate} LIMIT 1`, [programId]);
    return rows[0] || null;
  } };
}
module.exports = { makeProgramDetailsRepository };
