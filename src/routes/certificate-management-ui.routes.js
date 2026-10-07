const express=require('express'),ui=require('../config/ui'),v=require('../validators/implementation-validation');
const {errors}=require('../auth/authentication-errors');
const {makeResponseCodec}=require('../utils/implementation-response-codec');
function makePageRouter(bindings){const router=express.Router(),codec=makeResponseCodec();
  router.get(ui.certificateManagementUrl,bindings.security.requireSession,bindings.security.requireRole('TRAINING_ADMINISTRATOR'),async(req,res,next)=>{try{
    v.object(req.query,['programId','programPage','page']);if(Object.values(req.query).some(value=>typeof value!=='string'))return next(errors.validation());
    let programId;if(req.query.programId!==undefined){programId=v.positiveId(req.query.programId);if(!Number.isSafeInteger(Number(programId)))return next(errors.validation());}
    const page=v.page({page:req.query.page,pageSize:'100'}).page,programPage=v.page({page:req.query.programPage,pageSize:'100'}).page;
    const result=await bindings.pages.read(req.principal,{programId,page,programPage});
    const project=row=>({programId:codec.id(row.program_id),code:row.code,name:row.name});
    const programs=result.programs.map(project),selected=result.selected?project(result.selected):null;
    if(selected&&!programs.some(row=>row.programId===selected.programId))programs.push(selected);
    const link=changes=>ui.certificateManagementUrl+'?'+new URLSearchParams({...req.query,...(selected?{programId:selected.programId}:{}),...changes});
    res.render('admin/certificate-management',{...ui,csrfToken:res.locals.csrfToken,programs,selected,page,programPage,programTotal:result.programTotal,total:result.total,link,
      eligibleRegistrations:result.rows.map(row=>({registrationId:codec.id(row.registration_id),referenceNo:row.reference_no,participantName:row.participant_name,completionDate:codec.day(row.completion_date)}))});
  }catch(error){next(error.status===400&&error.code==='VALIDATION_ERROR'?errors.validation():error);}});return router;
}
module.exports={makePageRouter};
