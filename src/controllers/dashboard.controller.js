const ui = require('../config/ui');
const { getMenu, resolveDestination } = require('../services/navigation.service');
function renderDashboard(req, res) {
  const views = { PARTICIPANT: 'participant', TRAINER: 'staff', TRAINING_ADMINISTRATOR: 'staff', SYSTEM_ADMINISTRATOR: 'system-admin' };
  res.render('dashboard/' + views[req.principal.role], { ...ui, navigation: getMenu(req.principal),
    dashboardUrl: resolveDestination(req.principal.role), role: req.principal.role });
}
module.exports = { renderDashboard };
