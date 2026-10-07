function resolveSystemAdministratorRoleDefaults() {
  const parse = name => {
    const configurationError = () => Object.assign(new Error('System Administrator role configuration is invalid.'), { code: 'BOOTSTRAP_CONFIGURATION_ERROR' });
    let value;
    try { value = JSON.parse(process.env[name]); } catch { throw configurationError(); }
    if (!Array.isArray(value) || !value.length || value.some(item => typeof item !== 'string' || !item)) throw configurationError();
    return value;
  };
  return { accountStatus: 'ACTIVE', permissions: parse('SYSTEM_ADMINISTRATOR_PERMISSIONS_JSON'),
    accessScope: parse('SYSTEM_ADMINISTRATOR_ACCESS_SCOPE_JSON'),
    permittedResponsibilities: parse('SYSTEM_ADMINISTRATOR_RESPONSIBILITIES_JSON') };
}
module.exports = { resolveSystemAdministratorRoleDefaults };
