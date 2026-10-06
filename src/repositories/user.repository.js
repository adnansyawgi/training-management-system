const { normalizeWf001PersistenceError } = require('./wf001-persistence-error-classifier');

async function findByEmail(connection, email) {
  const [rows] = await connection.execute('SELECT user_id FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
}

async function createUser(connection, user) {
  try {
    const [result] = await connection.execute(`
      INSERT INTO users (
        account_identifier, username, name, email, password_hash, role_id, role_name,
        permissions, access_scope, permitted_responsibilities, account_status,
        role_assigned_at, activated_at, authentication_method, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      user.accountIdentifier, user.username, user.name, user.email, user.passwordHash,
      user.roleId, user.roleName, JSON.stringify(user.permissions), JSON.stringify(user.accessScope),
      JSON.stringify(user.permittedResponsibilities), user.accountStatus, user.roleAssignedAt,
      user.activatedAt || user.createdAt, user.authenticationMethod || 'PASSWORD', user.createdAt, user.updatedAt
    ]);
    return result.insertId;
  } catch (error) {
    throw normalizeWf001PersistenceError(error);
  }
}

module.exports = { findByEmail, createUser };
