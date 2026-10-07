const ui = require('../config/ui');
const destinations = Object.freeze({
  PARTICIPANT: '/participant/dashboard', TRAINER: '/staff/dashboard',
  TRAINING_ADMINISTRATOR: '/staff/dashboard', SYSTEM_ADMINISTRATOR: '/system-admin/dashboard'
});
const functions = Object.freeze({
  PARTICIPANT: [['Programs', ui.programListUrl], ['My Registrations', ui.myRegistrationsUrl]],
  TRAINER: [['Trainer Programs and Attendance', ui.trainerLandingUrl]],
  TRAINING_ADMINISTRATOR: [['Programs', ui.trainingAdministratorLandingUrl], ['Categories', ui.categoryManagementUrl],
    ['Registrations', ui.registrationManagementUrl], ['Certificates', ui.certificateManagementUrl], ['Reports', ui.reportsUrl]],
  SYSTEM_ADMINISTRATOR: [['Administrative Users', ui.adminLandingUrl]]
});
function resolveDestination(role) { return Object.hasOwn(destinations, role) ? destinations[role] : null; }
function getMenu(principal) {
  const entries = Object.hasOwn(functions, principal?.role) ? functions[principal.role] : null;
  if (!entries) return [];
  return entries.map(([label, href]) => ({ label, href }));
}
module.exports = { resolveDestination, getMenu };
