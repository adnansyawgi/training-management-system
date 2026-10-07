const { requireBootstrapLoopback } = require('../../../src/middleware/bootstrap-loopback');
const { makeApprovedBootstrapEmail } = require('../../../src/auth/bootstrap-approved-email');
const { errors } = require('../../../src/auth/authentication-errors');
test.each(['127.0.0.1','::1','::ffff:127.0.0.1'])('accepts loopback TCP peer %s', address => {
  const next=jest.fn(); requireBootstrapLoopback({socket:{remoteAddress:address}}, {}, next); expect(next).toHaveBeenCalledWith();
});
test.each(['192.168.1.10','203.0.113.10','::ffff:192.168.1.10','127.0.0.2',undefined])('rejects peer %s despite forwarded loopback', address => {
  const next=jest.fn(); requireBootstrapLoopback({socket:{remoteAddress:address},ip:'127.0.0.1',headers:{'x-forwarded-for':'127.0.0.1'}}, {}, next);
  expect(next.mock.calls[0][0]).toMatchObject({status:403,code:'ACCESS_FORBIDDEN'});
});
test('normalizes approved email and rejects mismatch without disclosure', () => {
  const verifier=makeApprovedBootstrapEmail({errors,configuredEmail:()=> ' APPROVED@EXAMPLE.TEST '});
  expect(()=>verifier.verify('approved@example.test')).not.toThrow();
  expect(()=>verifier.verify('other@example.test')).toThrow('Authentication failed.');
});
test.each([undefined,'','invalid'])('configuration %s fails closed', configured => {
  expect(()=>makeApprovedBootstrapEmail({errors,configuredEmail:()=>configured}).verify('admin@example.test')).toThrow('Bootstrap configuration is unavailable.');
});
