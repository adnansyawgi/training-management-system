const express = require('express');
const ui = require('../config/ui');

const router = express.Router();
router.get(ui.participantRegistrationUrl, (req, res) => {
  res.render('auth/participant-register', { ...ui });
});
router.get(ui.participantLoginUrl, (req, res) => {
  res.render('auth/participant-login', { ...ui });
});
router.get(ui.systemAdministratorBootstrapUrl, (req, res) => {
  res.render('auth/system-administrator-bootstrap', { ...ui });
});

module.exports = router;
