function makeAuthenticationSecurity({ pool, repository, audit, sessions, errors, now = () => new Date() }) {
  return {
    async coordinateAttempt(_email, callback) {
      const connection = await pool.getConnection();
      let released = false;
      const unit = { connection, now: now(), preparedSessionIds: [] };
      try {
        await connection.beginTransaction();
        const outcome = await callback(unit);
        // Failure outcomes commit counters/audit; thrown infrastructure failures roll back.
        await connection.commit();
        return outcome;
      } catch (error) {
        try { await connection.rollback(); } catch { /* preserve the original failure */ }
        connection.release();
        released = true;
        // Also handle uncertain commit results: no unpublished session may remain valid.
        for (const sessionId of unit.preparedSessionIds) {
          try { await sessions.invalidate(sessionId); }
          catch { console.error('Unpublished session cleanup failed', { code: 'SESSION_CLEANUP_ERROR' }); }
        }
        throw error;
      } finally { if (!released) connection.release(); }
    },
    async evaluateEligibility(unit, user, context) {
      let failure = null;
      if (['LOCKED', 'DISABLED'].includes(user.account_status) ||
          user.lockout_until && new Date(user.lockout_until).getTime() > unit.now.getTime()) {
        failure = errors.locked();
      } else if (user.account_status !== 'ACTIVE' || user.authentication_method === 'SYSTEM') {
        // INACTIVE -> 401 binding approved for WF-002.
        failure = errors.authentication();
      }
      if (failure) await audit.createAuthenticationAudit(unit, user, context, 'FAILURE');
      return failure;
    },
    async recordFailure(unit, user, context) {
      await repository.recordFailure(unit, user);
      await audit.createAuthenticationAudit(unit, user, context, 'FAILURE');
    },
    async recordSuccess(unit, user, context) {
      await repository.recordSuccess(unit, user);
      await audit.createAuthenticationAudit(unit, user, context, 'SUCCESS');
    },
    async recordRoleRejection(unit, user, context) {
      await audit.createAuthenticationAudit(unit, user, context, 'FAILURE');
    },
    async recordUnknownAttempt(unit, context) {
      await audit.createAuthenticationAudit(unit, null, context, 'FAILURE');
    }
  };
}
module.exports = { makeAuthenticationSecurity };
