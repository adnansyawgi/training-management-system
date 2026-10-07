function resolveSystemAdministratorRoleDefaults() {
  const parse = name => {
    try {
      const value = JSON.parse(process.env[name]);
      if (!Array.isArray(value) || !value.length || value.some(item => typeof item !== 'string' || !item)) throw new Error();
      return value;
    } catch {
      throw Object.assign(new Error('System Administrator role configuration is invalid.'), { code: 'BOOTSTRAP_CONFIGURATION_ERROR' });
    }
  };
  return { accountStatus: 'ACTIVE', permissions: parse('SYSTEM_ADMINISTRATOR_PERMISSIONS_JSON'),
    accessScope: parse('SYSTEM_ADMINISTRATOR_ACCESS_SCOPE_JSON'),
    permittedResponsibilities: parse('SYSTEM_ADMINISTRATOR_RESPONSIBILITIES_JSON') };
}
module.exports = { resolveSystemAdministratorRoleDefaults };
