const pool=require('./config/database');
const {errors}=require('./auth/authentication-errors');
const management=require('./training-program-category-management.bindings');
const audit=require('./repositories/audit.repository');
const {makeReportRepository}=require('./repositories/report-generation.repository');
const {makeReportExecutionRepository}=require('./repositories/report-execution.repository');
module.exports={reports:makeReportRepository({errors}),executions:makeReportExecutionRepository({pool,errors,authorization:management.authorization,audit:{reportEvent:audit.createReportAudit},clock:management.clock}),
  security:management.security,requestContext:management.requestContext};
