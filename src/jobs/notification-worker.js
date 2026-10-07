function makeNotificationWorker({ repository, mail, now = () => new Date() }) {
  return { async runOnce() {
    const row = await repository.claim(now());
    if (!row) return false;
    let success = false;
    try {
      const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
      await mail.send({ recipient: row.recipient, subject: row.subject, payload, messageId: row.outbox_id });
      success = true;
    } catch { /* Record only a safe fixed failure code, never raw SMTP content. */ }
    await repository.complete(row, now(), success);
    return true;
  } };
}
module.exports = { makeNotificationWorker };
