const { makeStaticAdministrationKey } = require('../../../src/auth/static-administration-key');
const { errors } = require('../../../src/auth/authentication-errors');
const keys = makeStaticAdministrationKey({ errors, configuredKey: () => 'configured-test-key' });
test('accepts the exact deployment key', async () => {
  await expect(keys.verify('configured-test-key')).resolves.toBeUndefined();
});
test.each([undefined, null, '', 123, {}, 'wrong', ' configured-test-key '])('rejects missing or invalid key %j with generic 401', async key => {
  await expect(keys.verify(key)).rejects.toMatchObject({ status: 401, message: 'Authentication failed.' });
});
test('fails closed when deployment key is unconfigured', async () => {
  await expect(makeStaticAdministrationKey({ errors, configuredKey: () => '' }).verify('any')).rejects.toMatchObject({ code: 'BOOTSTRAP_CONFIGURATION_ERROR' });
});
