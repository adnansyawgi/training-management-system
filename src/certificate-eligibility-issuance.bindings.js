const {ulid}=require('ulid');
const pool=require('./config/database');
const {errors}=require('./auth/authentication-errors');
const {sessions}=require('./participant-authentication.bindings');
const management=require('./training-program-category-management.bindings');
const audit=require('./repositories/audit.repository');
const {makeSessionSecurity}=require('./middleware/session-security');
const {makeCertificateRepository}=require('./repositories/certificate-eligibility-issuance.repository');
const {makeCertificatePageRepository}=require('./repositories/certificate-management-page.repository');
const {makeCertificateRules,businessDate}=require('./certificates/certificate-rules');
module.exports={repository:makeCertificateRepository({pool,errors,reference:()=> 'C-'+ulid(),attempts:3}),
  pages:makeCertificatePageRepository({pool,errors}),rules:makeCertificateRules({errors}),
  transactions:management.transactions,authorization:management.authorization,
  security:makeSessionSecurity({sessions,errors,audit:{csrfRejected:(principal,context)=>audit.createCsrfRejectionAudit(pool,principal,context,{entityType:'CERTIFICATE',accessScope:'ALL_TRAINING_OPERATIONS'})}}),
  clock:{now:management.clock.now,businessDate:now=>businessDate(now,process.env.BUSINESS_TIMEZONE||'Asia/Kuala_Lumpur')},
  audit:{certificateIssued:audit.createCertificateIssuedAudit},requestContext:management.requestContext};
