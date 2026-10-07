const { positiveId, sameId } = require('../validators/implementation-validation');
function makeAdministrativeUserRepository({ pool, errors, role = 'SYSTEM_ADMINISTRATOR' }) {
  if (!['SYSTEM_ADMINISTRATOR', 'TRAINING_ADMINISTRATOR', 'TRAINER'].includes(role)) throw new Error('Unsupported staff role binding.');
  return {
    async run(callback) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
      } catch (error) {
        try { await connection.rollback(); } catch { /* preserve original failure */ }
        throw error;
      } finally { connection.release(); }
    },
    async assertCreator(connection, context) {
      const userId = positiveId(context.principal.userId);
      const [users] = await connection.execute('SELECT role_id, role_name, account_status, authentication_method, lockout_until FROM users WHERE user_id = ? FOR UPDATE', [userId]);
      const user = users[0];
      const now = new Date();
      if (!user || user.role_id !== role || user.role_name !== user.role_id ||
          user.account_status !== 'ACTIVE' || user.authentication_method === 'SYSTEM' ||
          user.lockout_until && new Date(user.lockout_until) > now) throw errors.forbidden();
      const [rows] = await connection.execute('SELECT user_id, session_data, expires_at FROM sessions WHERE session_id = ? FOR UPDATE', [context.sessionId]);
      if (rows.length !== 1 || !sameId(rows[0].user_id, userId) || new Date(rows[0].expires_at) <= now) throw errors.authentication();
      const data = JSON.parse(rows[0].session_data);
      const absolute = new Date(data.absoluteExpiresAt);
      if (!Number.isFinite(absolute.getTime()) || absolute <= now || !sameId(data.userId, userId) ||
          data.role !== role || data.csrfToken !== context.principal.csrfToken) throw errors.authentication();
    }
  };
}
module.exports = { makeAdministrativeUserRepository };
