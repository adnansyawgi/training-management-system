const pool = require('./config/database');
const registrations = require('./participant-program-registration.bindings');
const { errors } = require('./auth/authentication-errors');
const { makeCancellationRepository } = require('./repositories/participant-registration-cancellation.repository');
const { beforeProgramStart } = require('./public/js/business-time');
module.exports = {
  ...registrations, repository: makeCancellationRepository({ pool, participants: registrations.repository, errors }),
  configuration: require('./config/registration-cancellation'),
  rules: { beforeProgramStart: (row, now) => beforeProgramStart(row.training_date, row.start_time, now, process.env.BUSINESS_TIMEZONE || 'Asia/Kuala_Lumpur') },
  audit: { registrationCancelled: require('./repositories/audit.repository').createRegistrationCancelledAudit }
};
