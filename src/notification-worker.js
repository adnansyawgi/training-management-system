require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./config/database');
const { makeNotificationRepository } = require('./repositories/registration-notification.repository');
const { makeNotificationWorker } = require('./jobs/notification-worker');
const { makeSmtpMail } = require('./notifications/smtp');
let stopping = false;
process.on('SIGINT', () => { stopping = true; });
process.on('SIGTERM', () => { stopping = true; });
async function main() {
  const worker = makeNotificationWorker({ repository: makeNotificationRepository({ pool }), mail: makeSmtpMail() });
  while (!stopping) {
    try { if (await worker.runOnce()) continue; }
    catch { console.error('Notification worker failed', { code: 'NOTIFICATION_STORE_ERROR' }); }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
main().catch(() => { console.error('Notification worker startup failed', { code: 'SMTP_CONFIGURATION_ERROR' }); process.exitCode = 1; }).finally(() => pool.end());
