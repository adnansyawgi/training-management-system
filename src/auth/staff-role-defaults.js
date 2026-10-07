function resolveStaffRoleDefaults(_connection, role) {
  if (!['TRAINING_ADMINISTRATOR', 'TRAINER'].includes(role)) throw new Error('Unsupported staff role.');
  const parse = suffix => {
    try {
      const value = JSON.parse(process.env[`${role}_${suffix}_JSON`]);
      if (!Array.isArray(value) || !value.length || value.some(item => typeof item !== 'string' || !item)) throw new Error();
      return value;
    } catch { throw Object.assign(new Error('Canonical staff role defaults are not configured.'), { code: 'STAFF_ROLE_CONFIGURATION_ERROR' }); }
  };
  return { accountStatus: 'ACTIVE', permissions: parse('PERMISSIONS'), accessScope: parse('ACCESS_SCOPE'), permittedResponsibilities: parse('RESPONSIBILITIES') };
}
module.exports = { resolveStaffRoleDefaults };
