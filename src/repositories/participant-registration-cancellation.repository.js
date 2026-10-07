const { positiveId, sameId } = require('../validators/implementation-validation');
const sorts = { REGISTERED_AT_DESC: 'r.registered_at DESC', REGISTERED_AT_ASC: 'r.registered_at ASC', DATE_ASC: 'p.training_date ASC', DATE_DESC: 'p.training_date DESC' };
function makeCancellationRepository({ pool, participants, errors }) {
  return {
    async readOwnPage(userId, filter) {
      const sort = sorts[filter.sort];
      if (!Object.hasOwn(sorts, filter.sort) || !Number.isSafeInteger((filter.page - 1) * filter.pageSize)) throw new Error('Invalid list binding.');
      const values = [positiveId(userId)]; let where = 'WHERE x.user_id = ?';
      if (filter.status !== undefined) { where += ' AND r.status = ?'; values.push(filter.status); }
      const source = 'FROM registrations r JOIN participants x ON x.participant_id = r.participant_id JOIN training_programs p ON p.program_id = r.program_id';
      const connection = await pool.getConnection();
      try {
        await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
        const [count] = await connection.execute(`SELECT COUNT(*) AS total ${source} ${where}`, values);
        const [rows] = await connection.execute(`SELECT r.registration_id,r.reference_no,r.program_id,p.code AS program_code,p.name AS program_name,
          DATE_FORMAT(p.training_date,'%Y-%m-%d') AS training_date,TIME_FORMAT(p.start_time,'%H:%i:%s') AS start_time,
          TIME_FORMAT(p.end_time,'%H:%i:%s') AS end_time,r.registered_at,r.status,r.cancelled_at,r.cancellation_reason
          ${source} ${where} ORDER BY ${sort},r.registration_id ASC LIMIT ? OFFSET ?`, [...values, filter.pageSize, (filter.page - 1) * filter.pageSize]);
        await connection.commit(); return { rows, total: count[0].total };
      } catch (error) { try { await connection.rollback(); } catch { /* preserve failure */ } throw error; }
      finally { connection.release(); }
    },
    async lockMutation(connection, registrationId, context) {
      const [relationships] = await connection.execute(`SELECT r.participant_id,r.program_id,x.user_id FROM registrations r
        JOIN participants x ON x.participant_id=r.participant_id WHERE r.registration_id=?`, [registrationId]);
      const relation = relationships[0];
      if (!relation) return null;
      if (!sameId(relation.user_id, context.principal.userId) || !sameId(relation.participant_id, context.principal.participantId)) throw errors.forbidden();
      await participants.lockParticipant(connection, context, false);
      const [programs] = await connection.execute(`SELECT DATE_FORMAT(training_date,'%Y-%m-%d') AS training_date,
        TIME_FORMAT(start_time,'%H:%i:%s') AS start_time FROM training_programs WHERE program_id=? FOR UPDATE`, [relation.program_id]);
      if (programs.length !== 1) throw errors.integrity();
      const [rows] = await connection.execute('SELECT registration_id,reference_no,participant_id,program_id,status FROM registrations WHERE registration_id=? FOR UPDATE', [registrationId]);
      const row = rows[0];
      if (!row) return null;
      if (!sameId(row.participant_id, relation.participant_id) || !sameId(row.program_id, relation.program_id)) throw errors.integrity();
      return { ...row, ...programs[0] };
    },
    async cancel(connection, registrationId, participantId, now, reason) {
      const [result] = await connection.execute(`UPDATE registrations SET status='CANCELLED',cancelled_at=?,cancellation_reason=?,updated_at=?
        WHERE registration_id=? AND participant_id=? AND status='REGISTERED'`, [now, reason, now, registrationId, participantId]);
      return result.affectedRows;
    }
  };
}
module.exports = { makeCancellationRepository };
