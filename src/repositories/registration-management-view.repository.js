const { positiveId } = require('../validators/implementation-validation');
const columns = 'r.registration_id,r.reference_no,r.participant_id,r.program_id,r.registered_at,r.status,r.cancelled_at,r.cancellation_reason';
function makeRegistrationManagementRepository({ pool, errors, sorts, requiredScope, requiredPermission }) {
  if (!requiredScope || !requiredPermission || !sorts || !Object.keys(sorts).length) throw new Error('Operational access and sort bindings required.');
  const access = `a.user_id=? AND a.role_id='TRAINING_ADMINISTRATOR' AND a.role_name=a.role_id
    AND a.account_status='ACTIVE' AND (a.authentication_method IS NULL OR a.authentication_method<>'SYSTEM')
    AND (a.lockout_until IS NULL OR a.lockout_until<=UTC_TIMESTAMP())
    AND JSON_CONTAINS(a.access_scope,?) AND JSON_CONTAINS(a.permissions,?)`;
  function scopeValues(scope) {
    if (scope?.name !== requiredScope) throw errors.forbidden();
    return [positiveId(scope.actorUserId), JSON.stringify(requiredScope), JSON.stringify(requiredPermission)];
  }
  async function read(scope, operation) {
    const values = scopeValues(scope), connection = await pool.getConnection();
    try {
      await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
      await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
      const [actors] = await connection.execute('SELECT a.user_id FROM users a WHERE '+access, values);
      if (actors.length !== 1) {
        // Failure must enter the catch block for rollback or failure auditing.
        // noinspection ExceptionCaughtLocallyJS
        throw errors.forbidden();
      }
      const result = await operation(connection, values);
      await connection.commit(); return result;
    } catch (error) { try { await connection.rollback(); } catch { /* preserve failure */ } throw error; }
    finally { connection.release(); }
  }
  const source = 'FROM registrations r JOIN training_programs p ON p.program_id=r.program_id';
  const visible = 'EXISTS (SELECT 1 FROM users a WHERE '+access+')';
  return {
    async operationalScope(principal) {
      if (principal?.role !== 'TRAINING_ADMINISTRATOR') throw errors.forbidden();
      const scope = { name: requiredScope, actorUserId: positiveId(principal.userId) };
      const [actors] = await pool.execute('SELECT a.user_id FROM users a WHERE '+access, scopeValues(scope));
      if (actors.length !== 1) {
        // Failure must enter the catch block for rollback or failure auditing.
        // noinspection ExceptionCaughtLocallyJS
        throw errors.forbidden();
      }
      return scope;
    },
    async adminPage(input, scope) {
      if (!Object.hasOwn(sorts,input.sort) || !Number.isSafeInteger(input.page) || input.page<1 || !Number.isInteger(input.pageSize) || input.pageSize<1 || input.pageSize>100 || !Number.isSafeInteger((input.page-1)*input.pageSize)) throw errors.validation();
      return read(scope, async (connection, accessValues) => {
        let where = 'WHERE '+visible; const values = [...accessValues];
        for (const [key,column] of [['programId','r.program_id'],['categoryId','p.category_id'],['participantId','r.participant_id'],['status','r.status']]) {
          if (input[key] !== undefined) { where+=' AND '+column+'=?'; values.push(input[key]); }
        }
        if (input.periodFrom) { where+=' AND r.registered_at>=?'; values.push(new Date(input.periodFrom)); }
        if (input.periodTo) { where+=' AND r.registered_at<?'; values.push(new Date(input.periodTo)); }
        const [count] = await connection.execute(`SELECT COUNT(*) AS total ${source} ${where}`,values);
        const [rows] = await connection.execute(`SELECT ${columns} ${source} ${where} ORDER BY ${sorts[input.sort]},r.registration_id ASC LIMIT ? OFFSET ?`,[...values,input.pageSize,(input.page-1)*input.pageSize]);
        return { rows, total: count[0].total };
      });
    },
    async adminDetail(id, scope) {
      return read(scope, async (connection, accessValues) => {
        const [rows] = await connection.execute(`SELECT ${columns},r.registration_remarks ${source} WHERE ${visible} AND r.registration_id=?`,[...accessValues,positiveId(id)]);
        return rows[0] || null;
      });
    }
  };
}
module.exports = { makeRegistrationManagementRepository };
