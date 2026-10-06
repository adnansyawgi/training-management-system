const express = require('express');
const { validateParticipantAccount } = require('../validators/participant-account.validator');
const { createParticipantAccount } = require('../controllers/participant-account.controller');

const router = express.Router();
router.post('/participants', validateParticipantAccount, createParticipantAccount);
module.exports = router;
