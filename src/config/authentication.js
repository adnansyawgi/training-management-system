// Validate external secrets at server startup, not while importing the app in tests.
function readAuthenticationConfig(env = process.env) {
  if (typeof env.SESSION_SECRET !== 'string' || Buffer.byteLength(env.SESSION_SECRET) < 32) {
    throw Object.assign(new Error('SESSION_SECRET must contain at least 32 bytes.'), { code: 'SESSION_CONFIGURATION_ERROR' });
  }
  if (!env.SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER?.trim()) {
    throw Object.assign(new Error('Reserved audit actor identifier is required.'), { code: 'AUDIT_ACTOR_CONFIGURATION_ERROR' });
  }
  const secure = env.SESSION_COOKIE_SECURE !== 'false';
  if (env.NODE_ENV === 'production' && !secure) {
    throw Object.assign(new Error('Production requires secure session cookies.'), { code: 'SESSION_CONFIGURATION_ERROR' });
  }
  return { secret: env.SESSION_SECRET, secure, cookieName: 'tms.sid', idleMs: 30 * 60 * 1000, absoluteMs: 8 * 60 * 60 * 1000 };
}
module.exports = { readAuthenticationConfig };
