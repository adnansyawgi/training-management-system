const { normalizeWf001PersistenceError } = require('./wf001-persistence-error-classifier');

async function findByNricPassportNo(connection, value) {
  const [rows] = await connection.execute('SELECT participant_id FROM participants WHERE nric_passport_no = ? LIMIT 1', [value]);
  return rows[0] || null;
}

async function createParticipant(connection, participant) {
  try {
    const [result] = await connection.execute(`
      INSERT INTO participants (user_id, nric_passport_no, name, mobile_no, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)`, [participant.userId, participant.nricPassportNo, participant.name,
      participant.mobileNo, participant.createdAt, participant.updatedAt]);
    return result.insertId;
  } catch (error) {
    throw normalizeWf001PersistenceError(error);
  }
}

module.exports = { findByNricPassportNo, createParticipant };
