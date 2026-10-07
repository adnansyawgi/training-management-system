const {positiveId}=require('../validators/implementation-validation');
function makeCertificatePageRepository({pool,errors}){return {async read(principal,{programId,programPage,page}){
  if(principal?.role!=='TRAINING_ADMINISTRATOR')throw errors.forbidden();const connection=await pool.getConnection();
  try{
    await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
    const [actors]=await connection.execute("SELECT user_id FROM users WHERE user_id=? AND role_id='TRAINING_ADMINISTRATOR' AND role_name=role_id AND account_status='ACTIVE' AND (authentication_method IS NULL OR authentication_method<>'SYSTEM') AND (lockout_until IS NULL OR lockout_until<=UTC_TIMESTAMP())",[positiveId(principal.userId)]);
    if(actors.length!==1) {
        // Failure must enter the catch block for rollback or failure auditing.
        // noinspection ExceptionCaughtLocallyJS
        throw errors.forbidden();
      }
    const [count]=await connection.execute('SELECT COUNT(*) AS total FROM training_programs');
    const [programs]=await connection.execute('SELECT program_id,code,name FROM training_programs ORDER BY program_id LIMIT 100 OFFSET ?',[(programPage-1)*100]);
    let selected=programs[0]||null;
    if(programId!==undefined){const [rows]=await connection.execute('SELECT program_id,code,name FROM training_programs WHERE program_id=?',[programId]);selected=rows[0]||null;if(!selected) {
        // Failure must enter the catch block for rollback or failure auditing.
        // noinspection ExceptionCaughtLocallyJS
        throw errors.validation();
      }}
    let rows=[],total=0;
    if(selected){
      const source=`FROM registrations r JOIN participants x ON x.participant_id=r.participant_id JOIN attendance a ON a.registration_id=r.registration_id
        WHERE r.program_id=? AND r.status='REGISTERED' AND a.status='PRESENT' AND a.percentage=100
        AND a.participant_id=r.participant_id AND a.program_id=r.program_id AND NOT EXISTS (SELECT 1 FROM certificates c WHERE c.registration_id=r.registration_id)`;
      const [eligibleCount]=await connection.execute('SELECT COUNT(*) AS total '+source,[selected.program_id]);total=Number(eligibleCount[0].total);
      [rows]=await connection.execute("SELECT r.registration_id,r.reference_no,x.name AS participant_name,DATE_FORMAT(a.attendance_date,'%Y-%m-%d') AS completion_date "+source+' ORDER BY r.registration_id ASC LIMIT 100 OFFSET ?',[selected.program_id,(page-1)*100]);
    }
    await connection.commit();return {programs,selected,rows,total,programTotal:Number(count[0].total)};
  }catch(error){try{await connection.rollback();}catch{}throw error;}finally{connection.release();}
}};}
module.exports={makeCertificatePageRepository};
