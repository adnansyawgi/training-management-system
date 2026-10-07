const express=require('express'),ui=require('../config/ui');
const v=require('../validators/implementation-validation');
const {errors}=require('../auth/authentication-errors');
const {makeResponseCodec}=require('../utils/implementation-response-codec');
const {localDateTime}=require('../public/js/business-time');
function makePageRouter(bindings){
  const router=express.Router(),codec=makeResponseCodec();
  const program=row=>({programId:codec.id(row.program_id),code:row.code,name:row.name,trainingDate:row.training_date});
  const page=req=>{v.object(req.query,['page']);if(Object.values(req.query).some(value=>typeof value!=='string')){ throw v.bad(); }return v.page({page:req.query.page,pageSize:'100'}).page;};
  const access=[bindings.security.requireSession,bindings.security.requireRole('TRAINER')];
  const fail=(error,next)=>next(error.status===400&&error.code==='VALIDATION_ERROR'?errors.validation():error);
  router.get(ui.trainerLandingUrl,...access,async(req,res,next)=>{try{
    const currentPage=page(req),result=await bindings.pages.assignedPrograms(req.principal,currentPage);
    res.render('trainer/programs',{...ui,programs:result.rows.map(program),page:currentPage,total:result.total});
  }catch(error){fail(error,next);}});
  router.get(ui.trainerLandingUrl+'/:programId/attendance',...access,async(req,res,next)=>{try{
    const programId=v.positiveId(req.params.programId);if(!Number.isSafeInteger(Number(programId))){ return next(errors.validation()); }const currentPage=page(req),result=await bindings.pages.roster(req.principal,programId,currentPage);
    const timezone=process.env.BUSINESS_TIMEZONE||'Asia/Kuala_Lumpur';new Intl.DateTimeFormat('en',{timeZone:timezone}).resolvedOptions();
    const selected=program(result.program),assigned=result.assignedPrograms.map(program);if(!assigned.some(row=>row.programId===selected.programId)){ assigned.push(selected); }
    res.render('trainer/attendance-management',{...ui,csrfToken:res.locals.csrfToken,businessTimezone:timezone,program:selected,assignedPrograms:assigned,page:currentPage,total:result.total,
      localInput:value=>value===null?'':localDateTime(codec.instant(value),timezone),
      records:result.rows.map(row=>({registrationId:codec.id(row.registration_id),referenceNo:row.reference_no,participantName:row.participant_name,status:row.status,attendanceDate:row.attendance_date,
        checkInAt:row.check_in_at,checkOutAt:row.check_out_at,verificationMethod:row.verification_method,evidenceReference:row.evidence_reference,remarks:row.remarks}))});
  }catch(error){fail(error,next);}});
  return router;
}
module.exports={makePageRouter};
