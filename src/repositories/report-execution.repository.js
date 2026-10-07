const {
  positiveId
} = require('../validators/implementation-validation');
const {
  makeResponseCodec
} = require('../utils/implementation-response-codec');
async function insert(connection, event) {
  const {
    definition,
    input,
    context,
    now
  } = event;
  const [result] = await connection.execute(`INSERT INTO report_executions (report_name,report_type,period_from,period_to,parameters,generated_at,generated_by,status,output_reference,data_access_classification)
      VALUES (?,?,?,?,?,?,?,'FAILED',NULL,'PERSONAL_DATA')`, [definition.name, definition.type, new Date(input.periodFrom), new Date(input.periodTo), JSON.stringify(input), now, context.principal.userId]);
  return positiveId(result.insertId);
}
function makeReportExecutionRepository({
  pool,
  errors,
  authorization,
  audit,
  clock
}) {
  const codec = makeResponseCodec();
  async function authorize(connection, context) {
    await authorization.assertCreator(connection, context);
    const [rows] = await connection.execute("SELECT user_id FROM users WHERE user_id=? AND JSON_CONTAINS(permissions,'\"REPORT_GENERATE\"') AND JSON_CONTAINS(access_scope,'\"ALL_TRAINING_OPERATIONS\"')", [context.principal.userId]);
    if (rows.length !== 1) {
      throw errors.forbidden();
    }
  }
  async function recordMaterializationFailure(connection, event, id) {
    try {
      await connection.query('ROLLBACK TO SAVEPOINT report_materialization');
      await audit.reportEvent(connection, {
        ...event,
        id,
        action: 'REPORT_GENERATION_FAILED',
        result: 'FAILURE'
      });
      await connection.commit();
      return true;
    } catch {
      // A deadlock or connection failure can invalidate the savepoint.
      return false;
    }
  }
  async function recoverFailure(connection, event, context) {
    try {
      await connection.beginTransaction();
      await authorize(connection, context);
      const failedId = await insert(connection, event);
      await audit.reportEvent(connection, {
        ...event,
        id: failedId,
        action: 'REPORT_GENERATION_FAILED',
        result: 'FAILURE'
      });
      await connection.commit();
    } catch {
      // Best effort journaling must never mask the original report failure.
      try {
        await connection.rollback();
      } catch {/* Connection may already be unavailable. */}
    }
  }
  return {
    async pageAccess(principal) {
      if (principal?.role !== 'TRAINING_ADMINISTRATOR') {
        throw errors.forbidden();
      }
      const [rows] = await pool.execute("SELECT user_id FROM users WHERE user_id=? AND role_id='TRAINING_ADMINISTRATOR' AND role_name=role_id AND account_status='ACTIVE' AND JSON_CONTAINS(permissions,'\"REPORT_GENERATE\"') AND JSON_CONTAINS(access_scope,'\"ALL_TRAINING_OPERATIONS\"')", [positiveId(principal.userId)]);
      if (rows.length !== 1) {
        throw errors.forbidden();
      }
    },
    async run({
      definition,
      input,
      context,
      materialize
    }) {
      const connection = await pool.getConnection(),
        event = {
          definition,
          input,
          context,
          now: clock.now()
        };
      let inserted = false,
        id;
      try {
        await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await connection.beginTransaction();
        await authorize(connection, context);
        id = await insert(connection, event);
        inserted = true;
        await connection.query('SAVEPOINT report_materialization');
        try {
          const execution = {
            reportExecutionId: codec.id(id),
            reportName: definition.name,
            reportType: definition.type,
            generatedAt: event.now,
            generatedBy: codec.id(context.principal.userId),
            status: 'SUCCESS'
          };
          const artifact = await materialize(connection, execution);
          if (!artifact || !['json', 'csv'].includes(artifact.kind) || typeof artifact.body !== 'string' || typeof artifact.contentType !== 'string') {
            // Failure must enter the catch block for rollback or failure auditing.
            // noinspection ExceptionCaughtLocallyJS
            throw errors.integrity();
          }
          await connection.execute("UPDATE report_executions SET status='SUCCESS' WHERE report_execution_id=?", [id]);
          await audit.reportEvent(connection, {
            ...event,
            id,
            action: 'REPORT_GENERATED',
            result: 'SUCCESS'
          });
          if (input.output === 'csv') {
            await audit.reportEvent(connection, {
              ...event,
              id,
              action: 'REPORT_DOWNLOADED',
              result: 'SUCCESS'
            });
          }
          await connection.commit();
          return artifact;
        } catch {
          // Materialization errors are deliberately replaced with the trusted integrity
          // error below so database or renderer details cannot reach the response.
          // Revert any successful completion/audits before recording failure.
          if (await recordMaterializationFailure(connection, event, id)) {
            inserted = false;
          }
          // The outer catch must perform transaction recovery.
          // noinspection ExceptionCaughtLocallyJS
          throw errors.integrity();
        }
      } catch (error) {
        try {
          await connection.rollback();
        } catch {/* Preserve the original failure when rollback is unavailable. */}
        if (inserted) {
          // Best effort recovery if the original transaction was invalidated.
          // A failure journal never commits without its mandatory failure audit.
          await recoverFailure(connection, event, context);
          // The outer catch must perform transaction recovery.
          // noinspection ExceptionCaughtLocallyJS
          throw errors.integrity();
        }
        throw error;
      } finally {
        connection.release();
      }
    }
  };
}
module.exports = {
  makeReportExecutionRepository
};
