const express = require('express');
const ui = require('../config/ui');
function makePageRouter({ security }) {
  const router = express.Router();
  router.get(ui.adminLandingUrl, security.requireSession, security.requireRole('SYSTEM_ADMINISTRATOR'), (req, res) => {
    res.render('admin/user-account-management', { ...ui, csrfToken: res.locals.csrfToken });
  });
  return router;
}
module.exports = { makePageRouter };
