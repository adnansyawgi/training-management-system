const express = require('express');
const ui = require('../config/ui');

const router = express.Router();
router.get(ui.participantRegistrationUrl, (req, res) => {
  res.render('auth/participant-register', { ...ui });
});

module.exports = router;
