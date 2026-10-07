const express=require('express');
const {errors}=require('./auth/authentication-errors');
const {makeValidators}=require('./validators/report-generation.validator');
const {makeService}=require('./services/report-generation.service');
function assemble(bindings){const router=express.Router(),validators=makeValidators({errors}),service=makeService(bindings);
  for(const type of ['certificates','registrations','accounts'])router.get('/admin/reports/'+type,bindings.security.requireSession,bindings.security.requireRole('TRAINING_ADMINISTRATOR'),validators[type],async(req,res,next)=>{
    try{const result=await service[type](req.validatedInput,bindings.requestContext(req));
      if(result.kind==='csv')res.setHeader('Content-Disposition','attachment; filename="'+type+'-report.csv"');
      res.status(200).type(result.contentType).send(result.body);
    }catch(error){next(error);}
  });return router;
}
module.exports={assemble};
