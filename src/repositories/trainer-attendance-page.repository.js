const {positiveId,sameId}=require('../validators/implementation-validation');
function makeTrainerAttendancePageRepository({pool,errors}){
  async function read(principal,operation){
    if(principal?.role!=='TRAINER')throw errors.forbidden();const userId=positiveId(principal.userId),connection=await pool.getConnection();
    try{
      await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
      const [users]=await connection.execute("SELECT user_id FROM users WHERE user_id=? AND role_id='TRAINER' AND role_name='TRAINER' AND account_status='ACTIVE' AND (authentication_method IS NULL OR authentication_method<>'SYSTEM') AND (lockout_until IS NULL OR lockout_until<=UTC_TIMESTAMP())",[userId]);
      if(users.length!==1)throw errors.forbidden();const result=await operation(connection,userId);await connection.commit();return result;
    }catch(error){try{await connection.rollback();}catch{}throw error;}finally{connection.release();}
  }
  const programSelect="SELECT program_id,code,name,trainer_user_id,DATE_FORMAT(training_date,'%Y-%m-%d') AS training_date FROM training_programs";
  async function programs(connection,userId,page){
    const [count]=await connection.execute('SELECT COUNT(*) AS total FROM training_programs WHERE trainer_user_id=?',[userId]);
    const [rows]=await connection.execute(programSelect+' WHERE trainer_user_id=? ORDER BY program_id ASC LIMIT 100 OFFSET ?',[userId,(page-1)*100]);return {rows,total:Number(count[0].total)};
  }
  return {
    assignedPrograms:(principal,page)=>read(principal,async(connection,userId)=>programs(connection,userId,page)),
    roster:(principal,programId,page)=>read(principal,async(connection,userId)=>{
      const [selected]=await connection.execute(programSelect+' WHERE program_id=?',[programId]);const program=selected[0];
      if(!program)throw errors.notFound();if(!sameId(program.trainer_user_id,userId))throw errors.forbidden();
      const assigned=await programs(connection,userId,1);
      const [count]=await connection.execute("SELECT COUNT(*) AS total FROM registrations WHERE program_id=? AND status='REGISTERED'",[programId]);
      const [rows]=await connection.execute(`SELECT r.registration_id,r.reference_no,x.name AS participant_name,a.status,
        DATE_FORMAT(a.attendance_date,'%Y-%m-%d') AS attendance_date,a.check_in_at,a.check_out_at,a.verification_method,a.evidence_reference,a.remarks
        FROM registrations r JOIN participants x ON x.participant_id=r.participant_id LEFT JOIN attendance a ON a.registration_id=r.registration_id
        WHERE r.program_id=? AND r.status='REGISTERED' ORDER BY r.registration_id ASC LIMIT 100 OFFSET ?`,[programId,(page-1)*100]);
      return {program,assignedPrograms:assigned.rows,rows,total:Number(count[0].total)};
    })
  };
}
module.exports={makeTrainerAttendancePageRepository};
