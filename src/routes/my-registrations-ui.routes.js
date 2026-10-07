const express = require('express');
const ui = require('../config/ui');
function makePageRouter(bindings) {
  const router = express.Router();
  router.get(ui.myRegistrationsUrl, bindings.security.requireSession, bindings.security.requireRole('PARTICIPANT'), (req, res) => {
    const businessTimezone = process.env.BUSINESS_TIMEZONE || 'Asia/Kuala_Lumpur';
    new Intl.DateTimeFormat('en', { timeZone: businessTimezone });
    res.render('registrations/my-registrations', { ...ui, csrfToken: res.locals.csrfToken, businessTimezone, sortOptions: bindings.configuration.sortOptions });
  });
  return router;
}
module.exports = { makePageRouter };
