const { createHash } = require('node:crypto');
const { positiveId } = require('../validators/implementation-validation');
const { scheduledStart } = require('../public/js/business-time');
const columns = { name:'name',description:'description',objectives:'objectives',targetAudience:'target_audience',prerequisites:'prerequisites',
  categoryId:'category_id',trainerUserId:'trainer_user_id',trainingDate:'training_date',startTime:'start_time',endTime:'end_time',venue:'venue',deliveryMode:'delivery_mode',
  capacity:'capacity',registrationOpenAt:'registration_open_at',registrationCloseAt:'registration_close_at',status:'status',cancellationPolicyReference:'cancellation_policy_reference',
  certificateEligibilityCriteria:'certificate_eligibility_criteria',certificateType:'certificate_type' };
const programSelect = `SELECT p.*,c.name AS category_name,u.name AS trainer_name,
  DATE_FORMAT(p.training_date,'%Y-%m-%d') AS training_date,TIME_FORMAT(p.start_time,'%H:%i:%s') AS start_time,
  TIME_FORMAT(p.end_time,'%H:%i:%s') AS end_time,
  p.capacity-(SELECT COUNT(*) FROM registrations r WHERE r.program_id=p.program_id AND r.status='REGISTERED') AS available_seats
  FROM training_programs p JOIN program_categories c ON c.category_id=p.category_id JOIN users u ON u.user_id=p.trainer_user_id`;
function makeManagementRepository({ pool, errors }) {
  async function programRow(connection, id) {
    const [rows] = await connection.execute(programSelect + ' WHERE p.program_id=?', [id]); return rows[0] || null;
  }
  function duplicate(error) {
    const match = error.code === 'ER_DUP_ENTRY' && /for key ['`]([^'`]+)['`]\s*$/i.exec(error.sqlMessage || error.message || '');
    if (match && ['name','program_categories.name','code','training_programs.code'].includes(match[1])) throw errors.conflict();
    throw error;
  }
  return {
    async run(callback) {
      const connection = await pool.getConnection(); let locked = false, lockName;
      try {
        const [database] = await connection.execute('SELECT DATABASE() AS db');
        lockName = 'tms-program-' + createHash('sha256').update(database[0].db).digest('hex').slice(0,48);
        const [lock] = await connection.execute('SELECT GET_LOCK(?,10) AS acquired',[lockName]);
        if (Number(lock[0].acquired) !== 1) throw new Error('Program management lock unavailable.');
        locked = true;
        // Serializes cross-program trainer/venue checks without adding a physical gate table.
        for (let attempt=0; attempt<3; attempt++) {
          await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED'); await connection.beginTransaction();
          try { const result = await callback(connection); await connection.commit(); return result; }
          catch (error) {
            await connection.rollback();
            if (['WF011_RETRY_PARTICIPANTS','ER_LOCK_DEADLOCK','ER_LOCK_WAIT_TIMEOUT'].includes(error.code) && attempt<2) continue;
            throw error;
          }
        }
      } finally {
        let discard = false;
        if (locked) { try { const [rows] = await connection.execute('SELECT RELEASE_LOCK(?) AS released',[lockName]); discard = Number(rows[0].released)!==1; } catch { discard=true; } }
        if (discard) connection.destroy(); else connection.release();
      }
    },
    async lockProgram(connection, id) {
      const [initial] = await connection.execute("SELECT DISTINCT participant_id FROM registrations WHERE program_id=? AND status='REGISTERED' ORDER BY participant_id",[id]);
      // Keep WF-009/WF-010 participant -> program order for schedule mutation.
      for (const row of initial) await connection.execute('SELECT participant_id FROM participants WHERE participant_id=? FOR UPDATE',[row.participant_id]);
      const [program] = await connection.execute('SELECT program_id FROM training_programs WHERE program_id=? FOR UPDATE',[id]);
      if (!program.length) return null;
      const [current] = await connection.execute("SELECT DISTINCT participant_id FROM registrations WHERE program_id=? AND status='REGISTERED' ORDER BY participant_id",[id]);
      if (initial.map(row=>String(row.participant_id)).join(',')!==current.map(row=>String(row.participant_id)).join(',')) {
        throw Object.assign(new Error('Participant set changed.'),{code:'WF011_RETRY_PARTICIPANTS'});
      }
      return programRow(connection,id);
    },
    async assertProgram(connection, before, next) {
      if (!before) {
        const [existing] = await connection.execute('SELECT program_id FROM training_programs WHERE code=?',[next.code]);
        if (existing.length) throw errors.conflict();
      }
      if (next.endTime<=next.startTime || next.registrationOpenAt>=next.registrationCloseAt) throw errors.validation();
      let start;
      try { start = scheduledStart(next.trainingDate,next.startTime,process.env.BUSINESS_TIMEZONE || 'Asia/Kuala_Lumpur'); }
      catch (error) {
        if (error instanceof RangeError) throw error; // Invalid deployment timezone is a configuration failure.
        throw errors.validation();
      }
      if (new Date(next.registrationCloseAt)>start) throw errors.validation();
      const [categories] = await connection.execute('SELECT category_id FROM program_categories WHERE category_id=? FOR UPDATE',[next.categoryId]);
      const [trainers] = await connection.execute("SELECT user_id FROM users WHERE user_id=? AND role_id='TRAINER' AND role_name='TRAINER' AND account_status='ACTIVE' AND (authentication_method IS NULL OR authentication_method<>'SYSTEM') FOR UPDATE",[next.trainerUserId]);
      if (!categories.length || !trainers.length) throw errors.validation();
      if (before) {
        const transitions = { DRAFT:['DRAFT','OPEN','CANCELLED'],OPEN:['OPEN','CLOSED','CANCELLED'],CLOSED:['CLOSED','COMPLETED','CANCELLED'],COMPLETED:['COMPLETED'],CANCELLED:['CANCELLED'] };
        if (!transitions[before.status]?.includes(next.status)) throw errors.validation();
        const [count] = await connection.execute("SELECT COUNT(*) AS used FROM registrations WHERE program_id=? AND status='REGISTERED'",[before.program_id]);
        if (next.capacity<Number(count[0].used)) throw errors.validation();
        if ([next.trainingDate,next.startTime,next.endTime].join('|')!==[before.training_date,before.start_time,before.end_time].join('|')) {
          const [overlap] = await connection.execute(`SELECT r2.registration_id FROM registrations r1 JOIN registrations r2 ON r2.participant_id=r1.participant_id
            JOIN training_programs p2 ON p2.program_id=r2.program_id WHERE r1.program_id=? AND r1.status='REGISTERED' AND r2.status='REGISTERED'
            AND r2.program_id<>? AND p2.training_date=? AND p2.start_time<? AND p2.end_time>? LIMIT 1`,
          [before.program_id,before.program_id,next.trainingDate,next.endTime,next.startTime]);
          if (overlap.length) throw errors.validation();
        }
      }
      if (!['COMPLETED','CANCELLED'].includes(next.status)) {
        const [conflicts] = await connection.execute(`SELECT program_id FROM training_programs WHERE program_id<>?
          AND status IN ('DRAFT','OPEN','CLOSED') AND training_date=? AND start_time<? AND end_time>?
          AND (trainer_user_id=? OR (? IS NOT NULL AND venue=?)) LIMIT 1`,
        [before?.program_id || 0,next.trainingDate,next.endTime,next.startTime,next.trainerUserId,next.venue,next.venue]);
        if (conflicts.length) throw errors.validation();
      }
    },
    async saveProgram(connection, before, next, now) {
      const values = Object.keys(columns).map(key => ['registrationOpenAt','registrationCloseAt'].includes(key) ? new Date(next[key]) : next[key]);
      let id = before?.program_id;
      try {
        if (before) await connection.execute(`UPDATE training_programs SET ${Object.values(columns).map(column=>column+'=?').join(',')},updated_at=? WHERE program_id=?`,[...values,now,id]);
        else {
          const [result] = await connection.execute(`INSERT INTO training_programs (code,${Object.values(columns).join(',')},created_at,updated_at) VALUES (${Array(values.length+3).fill('?').join(',')})`,[next.code,...values,now,now]);
          id = positiveId(result.insertId);
        }
      } catch (error) { duplicate(error); }
      return programRow(connection,id);
    },
    async lockCategory(connection, id) { const [rows]=await connection.execute('SELECT * FROM program_categories WHERE category_id=? FOR UPDATE',[id]); return rows[0] || null; },
    async saveCategory(connection, before, next, now) {
      let id=before?.category_id;
      try {
        if (before) await connection.execute('UPDATE program_categories SET name=?,description=?,status=?,updated_at=? WHERE category_id=?',[next.name,next.description,next.status,now,id]);
        else { const [result]=await connection.execute('INSERT INTO program_categories (name,description,status,created_at,updated_at) VALUES (?,?,?,?,?)',[next.name,next.description,next.status,now,now]); id=positiveId(result.insertId); }
      } catch (error) { duplicate(error); }
      const [rows]=await connection.execute('SELECT * FROM program_categories WHERE category_id=?',[id]); return rows[0];
    },
    async page(kind, page=1, pageSize=20) {
      const connection=await pool.getConnection();
      const types={programs:{source:'training_programs',select:programSelect,order:'p.program_id'},categories:{source:'program_categories',select:'SELECT * FROM program_categories',order:'category_id'},trainers:{source:"users WHERE role_id='TRAINER' AND role_name='TRAINER' AND account_status='ACTIVE'",select:"SELECT user_id,name FROM users WHERE role_id='TRAINER' AND role_name='TRAINER' AND account_status='ACTIVE'",order:'user_id'}};
      const type=types[kind];
      if (!type || !Number.isSafeInteger(page) || page<1 || !Number.isInteger(pageSize) || !Number.isSafeInteger((page-1)*pageSize) || pageSize<1 || pageSize>100) { connection.release(); throw errors.validation(); }
      try {
        await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ'); await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
        const [count]=await connection.execute('SELECT COUNT(*) AS total FROM '+type.source);
        const [rows]=await connection.execute(type.select+' ORDER BY '+type.order+' ASC LIMIT ? OFFSET ?', [pageSize,(page-1)*pageSize]);
        await connection.commit(); return {rows,total:Number(count[0].total),page,pageSize};
      } catch(error) {try{await connection.rollback();}catch{} throw error;} finally{connection.release();}
    },
    async getProgram(id) { return programRow(pool,id); },
    async getCategory(id) {const [rows]=await pool.execute('SELECT * FROM program_categories WHERE category_id=?',[id]);return rows[0] || null;}
  };
}
module.exports = { makeManagementRepository };
