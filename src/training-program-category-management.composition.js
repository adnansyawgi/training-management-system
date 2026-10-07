const express=require('express');
const {errors}=require('./auth/authentication-errors');
const {makeValidators}=require('./validators/training-program-category-management.validator');
const {makeService}=require('./services/training-program-category-management.service');
const {makeFeatureDto}=require('./repositories/training-program-category-management.dto');
const {makeController}=require('./controllers/system-administrator-bootstrap.controller');
const {makeResponseCodec}=require('./utils/implementation-response-codec');
const {makeResponseTransport}=require('./utils/implementation-response-transport');
function assemble(bindings){
  const codec=makeResponseCodec();const service=makeService({...bindings,errors,dto:makeFeatureDto(codec)});
  const validators=makeValidators({errors});
  const controller=makeController({service,requestContext:bindings.requestContext,response:makeResponseTransport(codec,{
    createProgram:['program'],updateProgram:['program'],createCategory:['categoryId','name','description','status','createdAt','updatedAt'],updateCategory:['categoryId','name','description','status','updatedAt']})});
  const router=express.Router();
  for(const [method,path,operation,status] of [['post','/admin/programs','createProgram',201],['put','/admin/programs/:programId','updateProgram',200],['post','/admin/categories','createCategory',201],['put','/admin/categories/:categoryId','updateCategory',200]]){
    router[method](path,bindings.security.requireSession,bindings.security.requireRole('TRAINING_ADMINISTRATOR'),bindings.security.requireCsrf,validators[operation],controller.endpoint(operation,status));
  }
  return router;
}
module.exports={assemble};
