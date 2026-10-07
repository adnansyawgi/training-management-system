const {sameId}=require('../validators/implementation-validation');
const certificateSelect="SELECT c.*,DATE_FORMAT(c.completion_date,'%Y-%m-%d') AS completion_date,DATE_FORMAT(c.issue_date,'%Y-%m-%d') AS issue_date FROM certificates c";
function makeCertificateRepository({errors,reference,attempts}){
  if(typeof reference!=='function'||!Number.isInteger(attempts)||attempts<1)throw new Error('Certificate reference binding required.');
  return {
    async lockEligibility(connection,id){
      const [relation]=await connection.execute('SELECT participant_id,program_id FROM registrations WHERE registration_id=?',[id]);if(!relation.length)return null;
      // Match WF-009/WF-010 participant -> program order. The certificate's
      // participant FK also needs this row; locking it after program would
      // deadlock against concurrent cancellation holding participant first.
      const [participants]=await connection.execute('SELECT participant_id FROM participants WHERE participant_id=? FOR UPDATE',[relation[0].participant_id]);
      if(!participants.length)throw errors.integrity();
      const [programs]=await connection.execute('SELECT program_id FROM training_programs WHERE program_id=? FOR UPDATE',[relation[0].program_id]);if(!programs.length)throw errors.integrity();
      const [registrations]=await connection.execute('SELECT registration_id,participant_id,program_id,status FROM registrations WHERE registration_id=? FOR UPDATE',[id]);
      const registration=registrations[0];if(!registration)return null;if(!sameId(registration.program_id,relation[0].program_id)||!sameId(registration.participant_id,relation[0].participant_id))throw errors.integrity();
      const [rows]=await connection.execute("SELECT a.*,DATE_FORMAT(a.attendance_date,'%Y-%m-%d') AS attendance_date FROM attendance a WHERE registration_id=? FOR UPDATE",[id]);
      const attendance=rows[0]||null;
      if(attendance&&(!sameId(attendance.participant_id,registration.participant_id)||!sameId(attendance.program_id,registration.program_id)))throw errors.integrity();
      return {registration,attendance};
    },
    async exists(connection,id){const [rows]=await connection.execute('SELECT certificate_id FROM certificates WHERE registration_id=? FOR UPDATE',[id]);return rows.length>0;},
    async insertWithReferenceRetry(connection,input,now){
      for(let attempt=0;attempt<attempts;attempt++){
        const number=reference();
        try{
          await connection.execute(`INSERT INTO certificates (certificate_number,participant_id,registration_id,program_id,certificate_type,certificate_title,
            eligibility_status,eligibility_result,attendance_percentage,completion_date,issue_date,certificate_status,document_reference,verification_reference,issuing_authority,issued_by,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[number,input.participantId,input.registrationId,input.programId,input.certificateType,input.certificateTitle,
            input.eligibilityStatus,input.eligibilityResult,input.attendancePercentage,input.completionDate,input.issueDate,input.certificateStatus,input.documentReference,input.verificationReference,input.issuingAuthority,input.issuedBy,now,now]);
        }catch(error){
          const match=error.code==='ER_DUP_ENTRY'&&/for key ['`]([^'`]+)['`]\s*$/i.exec(error.sqlMessage||error.message||'');
          if(match&&['registration_id','certificates.registration_id'].includes(match[1]))throw errors.conflict();
          if(match&&['certificate_number','certificates.certificate_number'].includes(match[1])&&attempt<attempts-1)continue;
          throw error;
        }
        const [rows]=await connection.execute(certificateSelect+' WHERE c.registration_id=?',[input.registrationId]);return rows[0];
      }
    }
  };
}
module.exports={makeCertificateRepository};
