const express = require('express');
const { renderDashboard } = require('../controllers/dashboard.controller');
function makeRouter({ security }) {
  const router = express.Router();
  router.get('/participant/dashboard', security.requireSession, security.requireRole('PARTICIPANT'), renderDashboard);
  router.get('/staff/dashboard', security.requireSession, security.requireRole(['TRAINER', 'TRAINING_ADMINISTRATOR']), renderDashboard);
  router.get('/system-admin/dashboard', security.requireSession, security.requireRole('SYSTEM_ADMINISTRATOR'), renderDashboard);
  return router;
}
module.exports = { makeRouter };
