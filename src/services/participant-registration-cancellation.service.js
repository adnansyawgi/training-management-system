function makeService(d) {
  return {
    async list(input, context) {
      const result = await d.repository.readOwnPage(context.principal.userId, input);
      return { items: result.rows.map(d.dto.ownRegistrationList), page: input.page, pageSize: input.pageSize, total: result.total };
    },
    async cancel(input, context) {
      if (context.principal?.role !== 'PARTICIPANT') throw d.errors.forbidden();
      return d.transactions.run(async connection => {
        const row = await d.repository.lockMutation(connection, input.registrationId, context);
        if (!row) throw d.errors.notFound();
        const now = d.clock.now();
        if (row.status !== 'REGISTERED' || !d.rules.beforeProgramStart(row, now)) throw d.errors.validation();
        const registrationId = d.codec.id(row.registration_id);
        const changed = await d.repository.cancel(connection, input.registrationId, context.principal.participantId, now, input.cancellationReason ?? null);
        if (changed !== 1) throw d.errors.validation();
        await d.audit.registrationCancelled(connection, { row, context, now });
        return { registrationId, referenceNo: row.reference_no, status: 'CANCELLED', cancelledAt: now.toISOString() };
      });
    }
  };
}
module.exports = { makeService };
