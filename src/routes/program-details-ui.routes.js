const express = require('express');
const ui = require('../config/ui');
const { makeValidators } = require('../validators/program-details.validator');
const { errors } = require('../auth/authentication-errors');
function makePageRouter() {
  const router = express.Router();
  router.get(ui.programDetailsBaseUrl + '/:programId', makeValidators({ errors }).detail, (req, res) => {
    res.render('programs/program-detail', { ...ui, programId: req.validatedInput.programId });
  });
  return router;
}
module.exports = { makePageRouter };
