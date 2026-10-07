const { validEmailShape } = require('../../../src/validators/email-shape');

test.each([
  ['a@b.c', true], ['a@b..c', true], ['a@.b.c', true], ['a@b.c.', true],
  ['a+b@b.c', true], ['é@例.测试', true],
  ['@b.c', false], ['a@.c', false], ['a@b.', false], ['a@b', false],
  ['a@@b.c', false], ['a b@b.c', false], ['a@b.c\n', false],
  ['a\u00a0@b.c', false], ['a@b\tc', false]
])('email shape %j retains validation outcome %s', (value, accepted) => {
  expect(validEmailShape(value)).toBe(accepted);
});

test('rejects a long domain without a separator', () => {
  expect(validEmailShape('a@' + 'b'.repeat(100000))).toBe(false);
});
