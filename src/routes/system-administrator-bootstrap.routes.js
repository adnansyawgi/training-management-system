const express = require('express');
function makeRouter({ controller, validators }) {
  const router = express.Router();
  router.post('/auth/system-admin/bootstrap', validators.bootstrap, controller.endpoint('bootstrap', 201));
  return router;
}
module.exports = { makeRouter };
