function resolveStaffRoleDefaults(_connection, role) {
  if (!['TRAINING_ADMINISTRATOR', 'TRAINER'].includes(role)) throw new Error('Unsupported staff role.');
  const parse = suffix => {
    const configurationError = () => Object.assign(new Error('Canonical staff role defaults are not configured.'), { code: 'STAFF_ROLE_CONFIGURATION_ERROR' });
    let value;
    try { value = JSON.parse(process.env[`${role}_${suffix}_JSON`]); } catch { throw configurationError(); }
    if (!Array.isArray(value) || !value.length || value.some(item => typeof item !== 'string' || !item)) throw configurationError();
    return value;
  };
  return { accountStatus: 'ACTIVE', permissions: parse('PERMISSIONS'), accessScope: parse('ACCESS_SCOPE'), permittedResponsibilities: parse('RESPONSIBILITIES') };
}
module.exports = { resolveStaffRoleDefaults };
