// src/routes/participant-authentication.routes.js
const express = require('express');
function makeRouter({ controller, validators, security }) {
  const router = express.Router();
  router.post('/auth/participants/login',
    validators.login, controller.endpoint('login', 200));
  return router;
}
module.exports = { makeRouter };
