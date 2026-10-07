const pool=require('./config/database');
const {errors}=require('./auth/authentication-errors');
const {sessions}=require('./participant-authentication.bindings');
const management=require('./training-program-category-management.bindings');
const audit=require('./repositories/audit.repository');
const {makeSessionSecurity}=require('./middleware/session-security');
const {makeAttendanceRepository}=require('./repositories/attendance-management.repository');
const {makeTrainerAttendancePageRepository}=require('./repositories/trainer-attendance-page.repository');
const {makeAdministrativeUserRepository}=require('./repositories/administrative-user-creation.repository');
module.exports={repository:makeAttendanceRepository({pool}),pages:makeTrainerAttendancePageRepository({pool,errors}),
  transactions:management.transactions,authorization:makeAdministrativeUserRepository({pool,errors,role:'TRAINER'}),
  security:makeSessionSecurity({sessions,errors,audit:{csrfRejected:(principal,context)=>audit.createCsrfRejectionAudit(pool,principal,context,{entityType:'ATTENDANCE',accessScope:'ASSIGNED_PROGRAMS'})}}),
  audit:{attendanceChanged:audit.createAttendanceAudit},clock:management.clock,requestContext:management.requestContext};
