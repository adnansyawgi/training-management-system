const express = require('express');
const { requireBootstrapLoopback } = require('../middleware/bootstrap-loopback');
function makeRouter({ controller, validators }) {
  const router = express.Router();
  router.post('/auth/system-admin/bootstrap', requireBootstrapLoopback, validators.bootstrap, controller.endpoint('bootstrap', 201));
  return router;
}
module.exports = { makeRouter };
