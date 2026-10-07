const {positiveId,sameId}=require('../validators/implementation-validation');
const {resolveTechnicalActor}=require('./audit.repository');
const {certificateDayBound}=require('../reports/business-period');
function makeReportRepository({errors}){
  async function attribution(connection,rows,technicalActor){
    if(!rows.length)return;
    const participants=rows.filter(row=>row.role_id==='PARTICIPANT'),staff=rows.filter(row=>row.role_id!=='PARTICIPANT');
    if(participants.some(row=>row.participant_id===null))throw errors.integrity();
    const clauses=[],values=[];
    for(const [type,entries,key] of [['PARTICIPANT_ACCOUNT',participants,'participant_id'],['ADMINISTRATIVE_USER_ACCOUNT',staff,'user_id']]){
      if(entries.length){clauses.push(`(a.entity_type=? AND a.entity_id IN (${entries.map(()=>'?').join(',')}))`);values.push(type,...entries.map(row=>String(row[key])));}
    }
    const [events]=await connection.execute(`SELECT a.entity_type,a.entity_id,a.actor_user_id,a.actor_role,a.new_value,creator.account_identifier
      FROM audit_records a JOIN users creator ON creator.user_id=a.actor_user_id
      WHERE a.action='ACCOUNT_CREATED' AND a.result='SUCCESS' AND (${clauses.join(' OR ')})`,values);
    for(const row of rows){const participant=row.role_id==='PARTICIPANT',type=participant?'PARTICIPANT_ACCOUNT':'ADMINISTRATIVE_USER_ACCOUNT';
      const matches=events.filter(event=>event.entity_type===type&&String(event.entity_id)===String(participant?row.participant_id:row.user_id));
      if(matches.length!==1)throw errors.integrity();const event=matches[0];
      let payload;
      try { payload=typeof event.new_value==='string'?JSON.parse(event.new_value):event.new_value; }
      catch { throw errors.integrity(); }
      if(!payload||!sameId(payload.userId,row.user_id)||event.actor_role!=='SYSTEM_ADMINISTRATOR')throw errors.integrity();
      if(participant&&(!sameId(payload.participantId,row.participant_id)||!sameId(event.actor_user_id,technicalActor)))throw errors.integrity();
      if(!participant&&(sameId(event.actor_user_id,technicalActor)||payload.role!==row.role_id||!event.account_identifier))throw errors.integrity();
      row.created_by=participant?'SELF-REGISTRATION':event.account_identifier;
      if(!participant){row.participant_id=null;row.mobile_no=null;}
    }
  }
  return {async read(connection,type,input){
    let source,select,key,where='WHERE 1=1',values=[];
    if(type==='certificates'){
      source='FROM certificates c JOIN participants x ON x.participant_id=c.participant_id JOIN registrations r ON r.registration_id=c.registration_id JOIN training_programs p ON p.program_id=c.program_id JOIN program_categories g ON g.category_id=p.category_id LEFT JOIN users issuer ON issuer.user_id=c.issued_by';
      select="SELECT c.certificate_number,c.participant_id,x.name AS participant_name,p.code AS program_code,p.name AS program_name,g.name AS category_name,DATE_FORMAT(p.training_date,'%Y-%m-%d') AS training_date,c.attendance_percentage,c.certificate_status,DATE_FORMAT(c.issue_date,'%Y-%m-%d') AS issue_date,issuer.name AS issuer_name";
      key='c.certificate_id';where+=' AND c.participant_id=r.participant_id AND c.program_id=r.program_id AND c.issue_date>=? AND c.issue_date<?';
      const timezone=process.env.BUSINESS_TIMEZONE||'Asia/Kuala_Lumpur';values.push(certificateDayBound(input.periodFrom,timezone),certificateDayBound(input.periodTo,timezone));
      if(input.certificateStatus!==undefined){where+=' AND c.certificate_status=?';values.push(input.certificateStatus);}
    }else if(type==='registrations'){
      source='FROM registrations r JOIN participants x ON x.participant_id=r.participant_id JOIN training_programs p ON p.program_id=r.program_id JOIN program_categories g ON g.category_id=p.category_id';
      select="SELECT r.registration_id,r.participant_id,x.name AS participant_name,p.code AS program_code,p.name AS program_name,g.name AS category_name,DATE_FORMAT(p.training_date,'%Y-%m-%d') AS training_date,r.registered_at,r.status,r.cancelled_at,r.cancellation_reason";
      key='r.registration_id';where+=' AND r.registered_at>=? AND r.registered_at<?';values.push(new Date(input.periodFrom),new Date(input.periodTo));
      if(input.status!==undefined){where+=' AND r.status=?';values.push(input.status);}
    }else if(type==='accounts'){
      source='FROM users u LEFT JOIN participants x ON x.user_id=u.user_id';
      select='SELECT u.user_id,u.role_id,u.name,u.email,u.account_status,u.created_at,u.last_login_at,x.participant_id,x.mobile_no';key='u.user_id';
      where+=" AND u.role_id IN ('PARTICIPANT','TRAINER','TRAINING_ADMINISTRATOR') AND u.role_name=u.role_id AND u.user_id<>? AND u.created_at>=? AND u.created_at<?";
      values.push(await resolveTechnicalActor(connection),new Date(input.periodFrom),new Date(input.periodTo));
      if(input.accountStatus!==undefined){where+=' AND u.account_status=?';values.push(input.accountStatus);}
    }else throw errors.validation();
    for(const [name,column] of [['programId','p.program_id'],['categoryId','p.category_id'],['participantId',type==='accounts'?'x.participant_id':type==='certificates'?'c.participant_id':'r.participant_id']]){
      if(input[name]!==undefined){where+=' AND '+column+'=?';values.push(positiveId(input[name]));}
    }
    const [counts]=await connection.execute(`SELECT COUNT(*) AS total ${source} ${where}`,values);
    const [rows]=await connection.execute(`${select} ${source} ${where} ORDER BY ${key} ASC LIMIT ? OFFSET ?`,[...values,input.pageSize,(input.page-1)*input.pageSize]);
    if(type==='accounts')await attribution(connection,rows,values[0]);
    const total=Number(counts[0].total);if(!Number.isSafeInteger(total)||total<0)throw errors.integrity();return {rows,total};
  }};
}
module.exports={makeReportRepository};
