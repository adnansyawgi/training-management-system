const express = require('express');
const ui = require('../config/ui');

const router = express.Router();
router.get(ui.participantRegistrationUrl, (req, res) => {
  res.render('auth/participant-register', { ...ui });
});
router.get([ui.staffLoginUrl, ui.administrativeLoginUrl], (req, res) => res.redirect('/login'));

module.exports = router;
