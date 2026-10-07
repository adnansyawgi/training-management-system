const express=require('express');
const {errors}=require('../auth/authentication-errors');
const {makeValidators}=require('../validators/attendance-management.validator');
const {makeFeatureDto}=require('../repositories/attendance-management.dto');
const {makeService}=require('../services/attendance-management.service');
const {makeController}=require('../controllers/system-administrator-bootstrap.controller');
const {makeResponseCodec}=require('../utils/implementation-response-codec');
const {makeResponseTransport}=require('../utils/implementation-response-transport');
function assemble(bindings){const codec=makeResponseCodec(),validators=makeValidators({errors});
  const service=makeService({...bindings,errors,dto:makeFeatureDto(codec)});
  const controller=makeController({service,requestContext:bindings.requestContext,response:makeResponseTransport(codec,{record:['items']})});
  const router=express.Router();router.post('/trainer/programs/:programId/attendance',bindings.security.requireSession,
    bindings.security.requireRole('TRAINER'),bindings.security.requireCsrf,validators.record,controller.endpoint('record',200));return router;
}
module.exports={assemble};
