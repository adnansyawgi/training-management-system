function makeService(d) {
  return { async create(input, context) {
    if (context.principal?.role !== 'SYSTEM_ADMINISTRATOR' || !['TRAINER', 'TRAINING_ADMINISTRATOR'].includes(input.role)) throw d.errors.forbidden();
    const passwordHash = await d.passwords.hashPassword(input.password);
    return d.transactions.run(async connection => {
      await d.authorization.assertCreator(connection, context);
      const access = await d.roles.resolve(connection, input.role);
      const now = d.clock.now();
      const account = await d.accounts.createWithIdentifierRetry(connection, {
        ...access, username: input.username, name: input.name, email: input.email,
        passwordHash, roleId: input.role, roleName: input.role,
        roleAssignedAt: now, activatedAt: now, authenticationMethod: 'PASSWORD', createdAt: now, updatedAt: now
      });
      d.responseCodec.id(account.userId);
      await d.audit.accountCreated(connection, { actorUserId: context.principal.userId,
        userId: account.userId, role: input.role, occurredAt: now, context });
      return { userId: account.userId, accountIdentifier: account.accountIdentifier,
        username: input.username, name: input.name, email: input.email, role: input.role,
        accountStatus: access.accountStatus, createdAt: now.toISOString() };
    });
  } };
}
module.exports = { makeService };
