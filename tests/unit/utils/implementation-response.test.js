const { positiveId, sameId } = require('../../../src/validators/implementation-validation');
const { makeResponseCodec } = require('../../../src/utils/implementation-response-codec');
const { makeResponseTransport } = require('../../../src/utils/implementation-response-transport');
test.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '01', '1e3', '9223372036854775808'])('rejects invalid or lossy identity %s', value => {
  expect(() => positiveId(value)).toThrow();
});
test('compares canonical identities without rounding', () => {
  expect(sameId(12, '12')).toBe(true);
  expect(sameId('9007199254740992', '9007199254740993')).toBe(false);
});
test('fails closed for unsafe numeric JSON IDs', () => {
  expect(makeResponseCodec().id('12')).toBe(12);
  expect(() => makeResponseCodec().id('9007199254740993')).toThrow();
});
test('projects only approved fields and UTC expiry', () => {
  const transport = makeResponseTransport(makeResponseCodec(), { login: ['userId', 'participantId', 'role', 'status', 'expiresAt'] });
  expect(transport.encode('login', { userId: '12', participantId: '34', role: 'PARTICIPANT', status: 'ACTIVE', expiresAt: new Date('2026-10-07T01:00:00Z'), sessionId: 'secret' })).toEqual({ userId: 12, participantId: 34, role: 'PARTICIPANT', status: 'ACTIVE', expiresAt: '2026-10-07T01:00:00.000Z' });
});
