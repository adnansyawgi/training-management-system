const express=require('express'),ui=require('../config/ui'),v=require('../validators/implementation-validation');
const {errors}=require('../auth/authentication-errors');
const definitions=require('../reports/report-definitions');
function makePageRouter(bindings){const router=express.Router();router.get(ui.reportsUrl,bindings.security.requireSession,bindings.security.requireRole('TRAINING_ADMINISTRATOR'),async(req,res,next)=>{try{
  v.object(req.query,[]);await bindings.executions.pageAccess(req.principal);const businessTimezone=process.env.BUSINESS_TIMEZONE||'Asia/Kuala_Lumpur';new Intl.DateTimeFormat('en',{timeZone:businessTimezone});
  res.render('admin/reports',{...ui,businessTimezone,definitions});
}catch(error){next(error.status===400&&error.code==='VALIDATION_ERROR'?errors.validation():error);}});return router;}
module.exports={makePageRouter};
