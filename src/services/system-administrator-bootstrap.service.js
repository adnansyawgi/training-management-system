function makeService(d) {
  return {
    async bootstrap(input, context) {
      try {
        await d.keys.verify(input.staticAdministrationKey);
        const passwordHash = await d.passwords.hashPassword(input.password);
        return await d.bootstrap.withExclusiveEligibility(async connection => {
          if (await d.users.hasActiveSystemAdministrator(connection)) throw d.errors.conflict();
          const controls = await d.roles.resolve(connection, 'SYSTEM_ADMINISTRATOR');
          const now = d.clock.now();
          const account = await d.accounts.createWithIdentifierRetry(connection, {
            ...controls, username: input.username, name: input.name, email: input.email,
            passwordHash, roleId: 'SYSTEM_ADMINISTRATOR', roleName: 'SYSTEM_ADMINISTRATOR',
            roleAssignedAt: now, activatedAt: now, authenticationMethod: 'PASSWORD',
            createdAt: now, updatedAt: now
          });
          // Reject unrepresentable IDs before committing, never round JSON numbers.
          d.responseCodec.id(account.userId);
          await d.audit.bootstrap(connection, { userId: account.userId, context, occurredAt: now });
          return { userId: account.userId, accountIdentifier: account.accountIdentifier,
            username: input.username, role: 'SYSTEM_ADMINISTRATOR',
            accountStatus: controls.accountStatus, createdAt: now.toISOString() };
        });
      } catch (error) {
        if ([401, 409].includes(error.status) && d.audit.bootstrapRejected) {
          await d.audit.bootstrapRejected(context);
        }
        throw error;
      }
    }
  };
}
module.exports = { makeService };
