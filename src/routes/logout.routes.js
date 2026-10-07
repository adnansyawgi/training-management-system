const express = require('express');
const { makeController } = require('../controllers/logout.controller');
function makeRouter(bindings) {
  const router = express.Router();
  router.post('/api/v1/auth/logout', bindings.security.requireSession, bindings.security.requireCsrf, makeController(bindings));
  return router;
}
module.exports = { makeRouter };
