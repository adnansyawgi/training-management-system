// src/routes/participant-authentication.routes.js
const express = require('express');
function makeRouter({ controller, validators, loginPath = '/auth/participants/login' }) {
  const router = express.Router();
  router.post(loginPath,
    validators.login, controller.endpoint('login', 200));
  return router;
}
module.exports = { makeRouter };
