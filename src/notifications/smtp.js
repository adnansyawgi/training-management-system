const nodemailer = require('nodemailer');
const { email } = require('../validators/implementation-validation');
function makeSmtpMail(env = process.env) {
  const port = Number(env.SMTP_PORT || 587);
  if (!env.SMTP_HOST || !Number.isInteger(port) || port < 1 || port > 65535 || !env.SMTP_FROM ||
      Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASSWORD)) { throw new Error('SMTP configuration required.'); }
  email(env.SMTP_FROM);
  const timezone = env.BUSINESS_TIMEZONE || 'Asia/Kuala_Lumpur';
  new Intl.DateTimeFormat('en', { timeZone: timezone }).resolvedOptions();
  return { async send({ recipient, subject, payload, messageId }) {
    email(recipient);
    const transport = nodemailer.createTransport({ host: env.SMTP_HOST, port, secure: port === 465,
      requireTLS: port !== 465, tls: { rejectUnauthorized: true },
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 10000, dnsTimeout: 10000,
      disableFileAccess: true, disableUrlAccess: true });
    let timer;
    try {
      const result = await Promise.race([transport.sendMail({ from: env.SMTP_FROM, to: recipient, subject,
        messageId: `<registration-${messageId}@${env.SMTP_FROM.split('@')[1]}>`,
        text: `Registration confirmed.\nReference: ${payload.referenceNo}\nProgram: ${payload.programName}\nSchedule: ${payload.trainingDate} ${payload.startTime} - ${payload.endTime} (${timezone})` }),
      new Promise((_, reject) => { timer = setTimeout(() => { transport.close(); reject(new Error('SMTP_TIMEOUT')); }, 10000); })]);
      if (!result.accepted?.length) { throw new Error('SMTP_NOT_ACCEPTED'); }
    } finally { clearTimeout(timer); transport.close(); }
  } };
}
module.exports = { makeSmtpMail };
