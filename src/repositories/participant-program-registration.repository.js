const { ulid } = require('ulid');
const v = require('../validators/implementation-validation');
const { publicProgramPredicate } = require('./public-program-policy');
function makeRegistrationRepository({ pool, errors, reference = () => 'R-' + ulid() }) {
  return {
    async run(callback) {
      const connection = await pool.getConnection();
      try {
        await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await connection.beginTransaction();
        const result = await callback(connection); await connection.commit(); return result;
      } catch (error) { try { await connection.rollback(); } catch { /* preserve failure */ } throw error; }
      finally { connection.release(); }
    },
    async lockParticipant(connection, context, requireComplete = true) {
      const [profiles] = await connection.execute('SELECT participant_id,user_id,name,mobile_no,nric_passport_no FROM participants WHERE user_id = ? FOR UPDATE', [v.positiveId(context.principal.userId)]);
      if (profiles.length !== 1 || !v.sameId(profiles[0].participant_id, context.principal.participantId)) { throw errors.authentication(); }
      const participant = profiles[0];
      const [users] = await connection.execute('SELECT email,role_id,role_name,account_status,authentication_method,lockout_until FROM users WHERE user_id = ? FOR UPDATE', [participant.user_id]);
      const user = users[0]; const now = new Date();
      if (user?.role_id !== 'PARTICIPANT' || user.role_name !== user.role_id || user.account_status !== 'ACTIVE' ||
          user.authentication_method === 'SYSTEM' || user.lockout_until && new Date(user.lockout_until) > now) { throw errors.authentication(); }
      const [sessions] = await connection.execute('SELECT user_id,session_data,expires_at FROM sessions WHERE session_id = ? FOR UPDATE', [context.sessionId]);
      if (sessions.length !== 1 || !v.sameId(sessions[0].user_id, participant.user_id) || new Date(sessions[0].expires_at) <= now) { throw errors.authentication(); }
      const data = JSON.parse(sessions[0].session_data), absolute = new Date(data.absoluteExpiresAt);
      if (!Number.isFinite(absolute.getTime()) || absolute <= now || data.role !== 'PARTICIPANT' ||
          !v.sameId(data.userId, participant.user_id) || !v.sameId(data.participantId, participant.participant_id) || data.csrfToken !== context.principal.csrfToken) { throw errors.authentication(); }
      try { if (requireComplete) { v.text(200)(participant.name); v.text(30)(participant.mobile_no); v.text(50)(participant.nric_passport_no); v.email(user.email); } }
      catch { throw errors.validation(); }
      return { ...participant, email: user.email };
    },
    async lockProgram(connection, programId) {
      const [rows] = await connection.execute(`SELECT p.program_id,p.name,p.capacity,p.status,p.registration_open_at,p.registration_close_at,
        DATE_FORMAT(p.training_date,'%Y-%m-%d') AS training_date,TIME_FORMAT(p.start_time,'%H:%i:%s') AS start_time,
        TIME_FORMAT(p.end_time,'%H:%i:%s') AS end_time FROM training_programs p
        JOIN program_categories c ON c.category_id = p.category_id
        WHERE p.program_id = ? AND ${publicProgramPredicate} FOR UPDATE`, [programId]);
      return rows[0] || null;
    },
    async assertRegistration(connection, participant, program, now) {
      const open = new Date(program.registration_open_at), close = new Date(program.registration_close_at);
      if (!Number.isFinite(open.getTime()) || !Number.isFinite(close.getTime())) { throw errors.integrity(); }
      if (program.status !== 'OPEN' || now < open || now >= close) { throw errors.conflict(); }
      const [duplicate] = await connection.execute("SELECT registration_id FROM registrations WHERE participant_id = ? AND program_id = ? AND status = 'REGISTERED' LIMIT 1", [participant.participant_id, program.program_id]);
      if (duplicate.length) { throw errors.conflict(); }
      const [count] = await connection.execute("SELECT COUNT(*) AS used FROM registrations WHERE program_id = ? AND status = 'REGISTERED'", [program.program_id]);
      if (Number(count[0].used) >= program.capacity) { throw errors.conflict(); }
      const [overlap] = await connection.execute(`SELECT r.registration_id FROM registrations r JOIN training_programs p ON p.program_id = r.program_id
        WHERE r.participant_id = ? AND r.status = 'REGISTERED' AND p.training_date = ? AND p.start_time < ? AND p.end_time > ? LIMIT 1`,
      [participant.participant_id, program.training_date, program.end_time, program.start_time]);
      if (overlap.length) { throw errors.conflict(); }
    },
    async insert(connection, participantId, programId, now) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const referenceNo = reference();
        try {
          const [result] = await connection.execute(`INSERT INTO registrations (reference_no,participant_id,program_id,registered_at,status,created_at,updated_at)
            VALUES (?,?,?,?,'REGISTERED',?,?)`, [referenceNo, participantId, programId, now, now, now]);
          return { registrationId: v.positiveId(result.insertId), referenceNo };
        } catch (error) {
          const match = error.code === 'ER_DUP_ENTRY' && /for key ['`]([^'`]+)['`]\s*$/i.exec(error.sqlMessage || error.message || '');
          const key = match?.[1];
          if (['uq_active_registration','registrations.uq_active_registration'].includes(key)) { throw errors.conflict(); }
          if (['reference_no','registrations.reference_no'].includes(key) && attempt < 2) { continue; }
          throw error;
        }
      }
    },
    async profile(userId) {
      const [rows] = await pool.execute(`SELECT p.name,p.nric_passport_no,u.email FROM participants p JOIN users u ON u.user_id = p.user_id WHERE p.user_id = ?`, [userId]);
      if (rows.length !== 1) { throw errors.authentication(); }
      const identity = Array.from(rows[0].nric_passport_no);
      return { name: rows[0].name, email: rows[0].email,
        maskedNricPassportNo: '*'.repeat(Math.max(4, identity.length - 4)) + (identity.length > 4 ? identity.slice(-4).join('') : '') };
    }
  };
}
module.exports = { makeRegistrationRepository };
