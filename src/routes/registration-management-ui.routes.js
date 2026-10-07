const express = require('express');
const ui = require('../config/ui');
const { errors } = require('../auth/authentication-errors');
const v = require('../validators/implementation-validation');
function makePageRouter(bindings) {
  const router = express.Router();
  router.get(ui.registrationManagementUrl, bindings.security.requireSession, bindings.security.requireRole('TRAINING_ADMINISTRATOR'), async (req,res,next) => {
    try {
      v.object(req.query, []);
      await bindings.authorization.operationalScope(req.principal);
      const businessTimezone = process.env.BUSINESS_TIMEZONE || 'Asia/Kuala_Lumpur';
      new Intl.DateTimeFormat('en',{timeZone:businessTimezone});
      res.render('admin/registration-management', { ...ui, businessTimezone, workflowJsUrl:ui.registrationManagementJsUrl,
        sortOptions:bindings.sortOptions, defaultSort:bindings.configuration.defaultSort });
    } catch(error) { next(error.status===400&&error.code==='VALIDATION_ERROR'?errors.validation():error); }
  });
  return router;
}
module.exports = { makePageRouter };
