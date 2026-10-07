require('dotenv').config();

console.log('DB Config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  passwordConfigured: Boolean(process.env.DB_PASSWORD)
});

const app = require('./app');
const { readAuthenticationConfig } = require('./config/authentication');
const { credentials, sessions } = require('./participant-authentication.bindings');
const port = Number(process.env.PORT || 3000);
async function start() {
  readAuthenticationConfig();
  const pool = require('./config/database');
  await require('./repositories/audit.repository').resolveTechnicalActor(pool);
  await pool.execute('SELECT failure_id FROM authentication_failures LIMIT 0');
  await credentials.initialize();
  await sessions.purgeExpired();
  const cleanup = setInterval(() => {
    sessions.purgeExpired().catch(() => console.error('Session expiry cleanup failed', { code: 'SESSION_STORE_ERROR' }));
  }, 60 * 1000);
  cleanup.unref();
  app.listen(port, () => console.log(`Training Management System API listening on port ${port}`));
}
start().catch(async error => {
  console.error('Application startup failed', { code: error.code || 'AUTHENTICATION_CONFIGURATION_ERROR' });
  process.exitCode = 1;
  await require('./config/database').end();
});
