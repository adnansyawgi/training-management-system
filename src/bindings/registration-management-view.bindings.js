const pool = require('../config/database');
const { errors } = require('../auth/authentication-errors');
const { makeRegistrationManagementRepository } = require('../repositories/registration-management-view.repository');
const management = require('./training-program-category-management.bindings');
const sorts = Object.freeze({ REGISTERED_AT_DESC:'r.registered_at DESC', REGISTERED_AT_ASC:'r.registered_at ASC', DATE_ASC:'p.training_date ASC', DATE_DESC:'p.training_date DESC' });
const registrations = makeRegistrationManagementRepository({ pool, errors, sorts, requiredScope:'ALL_TRAINING_OPERATIONS', requiredPermission:'REGISTRATION_READ' });
module.exports = {
  registrations, authorization: registrations,
  security: management.security, requestContext: management.requestContext,
  configuration: { sortKeys:Object.keys(sorts), defaultSort:'REGISTERED_AT_DESC' },
  sortOptions: [
    {value:'REGISTERED_AT_DESC',label:'Registered newest first'},
    {value:'REGISTERED_AT_ASC',label:'Registered oldest first'},
    {value:'DATE_ASC',label:'Training date earliest first'},
    {value:'DATE_DESC',label:'Training date latest first'}
  ]
};
