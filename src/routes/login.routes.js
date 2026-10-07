const express = require('express');
const ui = require('../config/ui');
const router = express.Router();
router.get('/login', (req, res) => res.render('auth/login', { ...ui }));
module.exports = router;
