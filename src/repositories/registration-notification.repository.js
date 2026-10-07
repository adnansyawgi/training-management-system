function makeNotificationRepository({ pool }) {
  return {
    async enqueueConfirmation(connection, event) {
      const payload = { referenceNo: event.referenceNo, programName: event.program.name,
        trainingDate: event.program.training_date, startTime: event.program.start_time, endTime: event.program.end_time };
      await connection.execute(`INSERT INTO notification_outbox
        (event_type,aggregate_type,aggregate_id,recipient,subject,payload,status,attempt_count,next_attempt_at,created_at,updated_at)
        VALUES ('REGISTRATION_CONFIRMED','REGISTRATION',?,?,'Training registration confirmed',?,'PENDING',0,?,?,?)`,
      [event.registrationId, event.participant.email, JSON.stringify(payload), event.now, event.now, event.now]);
    },
    async claim(now) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(`SELECT * FROM notification_outbox WHERE event_type = 'REGISTRATION_CONFIRMED'
          AND ((status = 'PENDING' AND next_attempt_at <= ?) OR (status = 'PROCESSING' AND updated_at <= ?))
          ORDER BY outbox_id LIMIT 1 FOR UPDATE SKIP LOCKED`, [now, new Date(now.getTime() - 60000)]);
        const row = rows[0];
        if (!row) { await connection.commit(); return null; }
        if (row.attempt_count >= 4) {
          await connection.execute("UPDATE notification_outbox SET status='FAILED',last_error='DELIVERY_ATTEMPTS_EXHAUSTED',next_attempt_at=NULL,updated_at=? WHERE outbox_id=?", [now, row.outbox_id]);
          await connection.commit(); return null;
        }
        await connection.execute("UPDATE notification_outbox SET status='PROCESSING',attempt_count=attempt_count+1,updated_at=? WHERE outbox_id=?", [now, row.outbox_id]);
        await connection.commit(); return { ...row, attempt_count: row.attempt_count + 1 };
      } catch (error) { try { await connection.rollback(); } catch { /* preserve failure */ } throw error; }
      finally { connection.release(); }
    },
    async complete(row, now, success) {
      const failed = !success && row.attempt_count >= 4;
      const failureStatus = failed ? 'FAILED' : 'PENDING';
      const next = !success && !failed ? new Date(now.getTime() + 60000 * 2 ** (row.attempt_count - 1)) : null;
      await pool.execute(`UPDATE notification_outbox SET status=?,next_attempt_at=?,last_error=?,updated_at=?
        WHERE outbox_id=? AND status='PROCESSING' AND attempt_count=?`,
      [success ? 'SENT' : failureStatus, next, success ? null : 'SMTP_DELIVERY_FAILED', now, row.outbox_id, row.attempt_count]);
    }
  };
}
module.exports = { makeNotificationRepository };
