const { createHash } = require('node:crypto');
const { ulid } = require('ulid');
const { positiveId } = require('../validators/implementation-validation');

function makeBootstrapRepository({ pool, errors, generateIdentifier = () => `A-${ulid()}` }) {
  async function withExclusiveEligibility(callback) {
    const connection = await pool.getConnection();
    let lockName, locked = false;
    try {
      const [database] = await connection.execute('SELECT DATABASE() AS database_name');
      if (!database[0]?.database_name) throw new Error('Bootstrap database is not configured.');
      lockName = 'tms-bootstrap-' + createHash('sha256').update(database[0].database_name).digest('hex').slice(0, 48);
      const [locks] = await connection.execute('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
      if (Number(locks[0]?.acquired) !== 1) throw new Error('Bootstrap lock acquisition failed.');
      locked = true;
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      try { await connection.rollback(); } catch { /* preserve original failure */ }
      throw error;
    } finally {
      let discard = false;
      if (locked) {
        try {
          const [rows] = await connection.execute('SELECT RELEASE_LOCK(?) AS released', [lockName]);
          discard = Number(rows[0]?.released) !== 1;
        } catch { discard = true; }
      }
      // Advisory locks survive transactions. Never return a locked connection to the pool.
      if (discard) connection.destroy();
      else connection.release();
    }
  }
  async function hasActiveSystemAdministrator(connection) {
    const [rows] = await connection.execute("SELECT user_id FROM users WHERE role_id = 'SYSTEM_ADMINISTRATOR' AND account_status = 'ACTIVE' LIMIT 1");
    return rows.length > 0;
  }
  async function createWithIdentifierRetry(connection, user) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const accountIdentifier = generateIdentifier();
      try {
        const [result] = await connection.execute(`INSERT INTO users (
          account_identifier, username, name, email, password_hash, role_id, role_name,
          permissions, access_scope, permitted_responsibilities, account_status,
          role_assigned_at, activated_at, authentication_method, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          accountIdentifier, user.username, user.name, user.email, user.passwordHash,
          user.roleId, user.roleName, JSON.stringify(user.permissions), JSON.stringify(user.accessScope),
          JSON.stringify(user.permittedResponsibilities), user.accountStatus, user.roleAssignedAt,
          user.activatedAt, user.authenticationMethod, user.createdAt, user.updatedAt
        ]);
        return { userId: positiveId(result.insertId), accountIdentifier };
      } catch (error) {
        const match = error.code === 'ER_DUP_ENTRY' && /for key ['`]([^'`]+)['`]\s*$/i.exec(error.sqlMessage || error.message || '');
        const key = match && match[1];
        // Verified names from v1.0; do not classify duplicate VALUES as key names.
        if (['username', 'users.username', 'email', 'users.email'].includes(key)) throw errors.conflict();
        if (['account_identifier', 'users.account_identifier'].includes(key) && attempt < 2) continue;
        throw error;
      }
    }
    throw new Error('Account identifier retry exhausted.');
  }
  return { withExclusiveEligibility, hasActiveSystemAdministrator, createWithIdentifierRetry };
}
module.exports = { makeBootstrapRepository };
