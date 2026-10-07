function validEmailShape(value) {
  const parts = value.split('@');
  if (parts.length !== 2 || !parts[0] || /\s/.test(value)) { return false; }
  const domain = parts[1];
  const dot = domain.indexOf('.', 1);
  return dot > 0 && dot < domain.length - 1;
}
module.exports = { validEmailShape };
