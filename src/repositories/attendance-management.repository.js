const {positiveId}=require('../validators/implementation-validation');
const attendanceSelect="SELECT a.*,DATE_FORMAT(a.attendance_date,'%Y-%m-%d') AS attendance_date FROM attendance a";
function makeAttendanceRepository(){return {
  async lockProgram(connection,id){const [rows]=await connection.execute('SELECT program_id,trainer_user_id FROM training_programs WHERE program_id=? FOR UPDATE',[id]);return rows[0]||null;},
  async lockBatch(connection,ids){const result=new Map();
    const ordered=[...ids].sort((a,b)=>{ if (BigInt(a)<BigInt(b)) { return -1; } return BigInt(a)>BigInt(b)?1:0; });
    for(const id of ordered){const [rows]=await connection.execute('SELECT registration_id,participant_id,program_id,status FROM registrations WHERE registration_id=? FOR UPDATE',[id]);
      if(rows[0]){ result.set(positiveId(rows[0].registration_id),rows[0]); }}
    return result;
  },
  async findForUpdate(connection,id){const [rows]=await connection.execute(attendanceSelect+' WHERE a.registration_id=? FOR UPDATE',[id]);return rows[0]||null;},
  async save(connection,before,input,now){
    const mutable=[input.attendanceDate,input.status,input.percentage,input.checkInAt?new Date(input.checkInAt):null,input.checkOutAt?new Date(input.checkOutAt):null,
      input.verificationMethod??null,input.evidenceReference??null,input.remarks??null,input.recordedBy];
    if(before){ await connection.execute(`UPDATE attendance SET attendance_date=?,status=?,percentage=?,check_in_at=?,check_out_at=?,verification_method=?,evidence_reference=?,remarks=?,recorded_by=?,updated_at=? WHERE attendance_id=?`,[...mutable,now,before.attendance_id]); }
    else { await connection.execute(`INSERT INTO attendance (registration_id,participant_id,program_id,attendance_date,status,percentage,check_in_at,check_out_at,verification_method,evidence_reference,remarks,recorded_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[input.registrationId,input.participantId,input.programId,...mutable,now,now]); }
    const [rows]=await connection.execute(attendanceSelect+' WHERE a.registration_id=?',[input.registrationId]);return rows[0];
  }
};}
module.exports={makeAttendanceRepository};
