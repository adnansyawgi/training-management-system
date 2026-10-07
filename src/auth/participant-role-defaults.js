function parseJsonEnvironment(name) {
  if (!process.env[name]) {
    const error = new Error(`Missing canonical role configuration: ${name}.`);
    error.code = 'ROLE_CONFIGURATION_ERROR';
    throw error;
  }
  let value;
  try {
    value = JSON.parse(process.env[name]);
  } catch (error) {
    error.code = 'ROLE_CONFIGURATION_ERROR';
    throw error;
  }
  if (!Array.isArray(value)) {
    throw Object.assign(new Error(`${name} must be a JSON array.`), { code: 'ROLE_CONFIGURATION_ERROR' });
  }
  return value;
}

function resolveParticipantRoleDefaults() {
  return {
    permissions: parseJsonEnvironment('PARTICIPANT_PERMISSIONS_JSON'),
    accessScope: parseJsonEnvironment('PARTICIPANT_ACCESS_SCOPE_JSON'),
    permittedResponsibilities: parseJsonEnvironment('PARTICIPANT_RESPONSIBILITIES_JSON')
  };
}

module.exports = { resolveParticipantRoleDefaults };
