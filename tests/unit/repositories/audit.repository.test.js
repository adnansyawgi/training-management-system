const { createParticipantSelfRegistrationAudit: createAudit } = require('../../../src/repositories/audit.repository');
const originalIdentity = process.env.SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER;
afterEach(() => {
  if (originalIdentity === undefined) delete process.env.SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER;
  else process.env.SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER = originalIdentity;
});

test('fails closed without a bound reserved actor', async () => {
  delete process.env.SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER;
  const connection = { execute: jest.fn() };
  await expect(createAudit(connection, {})).rejects.toMatchObject({ code: 'AUDIT_ACTOR_CONFIGURATION_ERROR' });
  expect(connection.execute).not.toHaveBeenCalled();
});

test.each([[[]], [[{ user_id: 1 }, { user_id: 2 }]]])('rejects missing or ambiguous actor', async actors => {
  process.env.SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER = 'A-reserved';
  const connection = { execute: jest.fn().mockResolvedValue([actors]) };
  await expect(createAudit(connection, {})).rejects.toMatchObject({ code: 'AUDIT_ACTOR_CONFIGURATION_ERROR' });
  expect(connection.execute).toHaveBeenCalledTimes(1);
});

test('selects the exact reserved identity and audits only account references', async () => {
  process.env.SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER = 'A-reserved';
  const connection = { execute: jest.fn().mockResolvedValueOnce([[{ user_id: 9 }]]).mockResolvedValueOnce([{}]) };
  await createAudit(connection, { userId: 10, participantId: 11, createdAt: new Date(), correlationId: 'test' });
  expect(connection.execute.mock.calls[0][0]).toContain('account_identifier = ?');
  expect(connection.execute.mock.calls[0][1]).toEqual(['A-reserved']);
  const values = connection.execute.mock.calls[1][1];
  expect(values[1]).toBe(9);
  expect(JSON.parse(values[9])).toEqual({ userId: 10, participantId: 11 });
});

test.each([
  ['SYSTEM_ADMINISTRATOR', 'SUCCESS', 'SYSTEM_ADMINISTRATOR', 'System Administrator', 'ALL_ADMINISTRATIVE_USERS'],
  ['SYSTEM_ADMINISTRATOR', 'FAILURE', null, 'System Administrator', 'ALL_ADMINISTRATIVE_USERS'],
  ['STAFF', 'SUCCESS', 'TRAINING_ADMINISTRATOR', 'Training Administrator', 'ALL_TRAINING_OPERATIONS'],
  ['STAFF', 'SUCCESS', 'TRAINER', 'Trainer', 'ASSIGNED_PROGRAMS'],
  ['STAFF', 'FAILURE', null, 'Staff', 'STAFF'],
  ['PARTICIPANT', 'SUCCESS', 'PARTICIPANT', 'Participant', 'PARTICIPANT'],
  ['PARTICIPANT', 'FAILURE', null, 'Participant', 'PARTICIPANT']
])('authentication audit retains identity and scope for %s/%s/%s', async (authenticationRole, outcome, role, label, scope) => {
  process.env.SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER = 'A-reserved';
  const connection = { execute: jest.fn().mockResolvedValue([[{ user_id: 9 }]]) };
  const user = role ? { user_id: 10, role_id: role } : null;
  await require('../../../src/repositories/audit.repository').createAuthenticationAudit(
    { connection, now: new Date() }, user, { authenticationRole }, outcome);
  const values = connection.execute.mock.calls.at(-1)[1];
  expect(values[7]).toBe(`${label} authentication ${outcome === 'SUCCESS' ? 'succeeded.' : 'was rejected.'}`);
  expect(values[10]).toBe(scope);
  expect(values[1]).toBe(outcome === 'SUCCESS' ? 10 : 9);
});
