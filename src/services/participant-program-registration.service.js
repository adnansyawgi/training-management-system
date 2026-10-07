function makeService({ transactions, repository, errors, codec, audit, outbox, clock }) {
  return { async register({ programId }, context) {
    if (context.principal?.role !== 'PARTICIPANT') throw errors.forbidden();
    return transactions.run(async connection => {
      const participant = await repository.lockParticipant(connection, context);
      const program = await repository.lockProgram(connection, programId);
      if (!program) throw errors.notFound();
      const now = clock.now();
      await repository.assertRegistration(connection, participant, program, now);
      const registration = await repository.insert(connection, participant.participant_id, programId, now);
      // Fail before commit if the approved response cannot represent any identity.
      codec.id(registration.registrationId); codec.id(programId);
      await audit.registrationCreated(connection, { ...registration, programId, participant, context, now });
      await outbox.enqueueConfirmation(connection, { ...registration, program, participant, now });
      return { ...registration, programId, status: 'REGISTERED', registeredAt: now.toISOString() };
    });
  } };
}
module.exports = { makeService };
