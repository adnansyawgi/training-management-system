const express = require('express');
const { makeController } = require('../controllers/profile.controller');
function makeRouter(bindings) {
  const router = express.Router(), controller = makeController(bindings);
  router.get('/profile', bindings.security.requireSession, controller.page);
  router.get('/api/v1/profile', bindings.security.requireSession, controller.get);
  router.put('/api/v1/profile', bindings.security.requireSession, bindings.security.requireCsrf, controller.update);
  return router;
}
module.exports = { makeRouter };
