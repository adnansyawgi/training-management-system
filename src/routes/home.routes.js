const express = require('express');
const ui = require('../config/ui');
const router = express.Router();
router.get('/', (req, res) => res.render('home', { ...ui }));
module.exports = router;
