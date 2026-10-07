const express=require('express');
const {errors}=require('../auth/authentication-errors');
const {makeValidators}=require('../validators/certificate-eligibility-issuance.validator');
const {makeFeatureDto,fields}=require('../repositories/certificate-eligibility-issuance.dto');
const {makeService}=require('../services/certificate-eligibility-issuance.service');
const {makeController}=require('../controllers/system-administrator-bootstrap.controller');
const {makeResponseCodec}=require('../utils/implementation-response-codec');
const {makeResponseTransport}=require('../utils/implementation-response-transport');
function assemble(bindings){const codec=makeResponseCodec(),validators=makeValidators({errors});
  const service=makeService({...bindings,errors,dto:makeFeatureDto(codec)});
  const controller=makeController({service,requestContext:bindings.requestContext,response:makeResponseTransport(codec,{issue:fields.map(row=>row[0])})});
  const router=express.Router();router.post('/admin/certificates',bindings.security.requireSession,bindings.security.requireRole('TRAINING_ADMINISTRATOR'),bindings.security.requireCsrf,validators.issue,controller.endpoint('issue',201));return router;
}
module.exports={assemble};
