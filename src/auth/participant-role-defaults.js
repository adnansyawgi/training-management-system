function parseJsonEnvironment(name) {
  if (!process.env[name]) {
    const error = new Error(`Missing canonical role configuration: ${name}.`);
    error.code = 'ROLE_CONFIGURATION_ERROR';
    throw error;
  }
  try {
    const value = JSON.parse(process.env[name]);
    if (!Array.isArray(value)) throw new Error(`${name} must be a JSON array.`);
    return value;
  } catch (error) {
    error.code = 'ROLE_CONFIGURATION_ERROR';
    throw error;
  }
}

function resolveParticipantRoleDefaults() {
  return {
    permissions: parseJsonEnvironment('PARTICIPANT_PERMISSIONS_JSON'),
    accessScope: parseJsonEnvironment('PARTICIPANT_ACCESS_SCOPE_JSON'),
    permittedResponsibilities: parseJsonEnvironment('PARTICIPANT_RESPONSIBILITIES_JSON')
  };
}

module.exports = { resolveParticipantRoleDefaults };
