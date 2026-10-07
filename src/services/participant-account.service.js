const pool = require('../config/database');
const userRepository = require('../repositories/user.repository');
const participantRepository = require('../repositories/participant.repository');
const auditRepository = require('../repositories/audit.repository');
const {
  resolveParticipantRoleDefaults
} = require('../auth/participant-role-defaults');
const {
  hashPassword
} = require('../auth/password-hasher');
const {
  generateParticipantIdentifiers
} = require('../utils/account-identifier');
async function createParticipantAccount(input, requestContext = {}) {
  if (await userRepository.findByEmail(pool, input.email)) {
    throw duplicateAccountError();
  }
  if (await participantRepository.findByNricPassportNo(pool, input.nricPassportNo)) {
    throw duplicateAccountError();
  }
  const passwordHash = await hashPassword(input.password);
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const connection = await pool.getConnection();
    const createdAt = new Date();
    try {
      await connection.beginTransaction();
      const participantId = await persistParticipantAccount(connection, input, passwordHash, createdAt, requestContext);
      await connection.commit();
      return {
        participantId,
        status: 'ACTIVE',
        createdAt: createdAt.toISOString()
      };
    } catch (error) {
      try {
        await connection.rollback();
      } catch (_) {/* preserve original failure */}
      if (retryParticipantCreation(error, attempt)) {
        continue;
      }
    } finally {
      connection.release();
    }
  }
  throw internalError();
}
function retryParticipantCreation(error, attempt) {
  if (error.wf001ConflictType === 'PARTICIPANT_EMAIL_OR_NRIC') {
    throw duplicateAccountError();
  }
  if (error.wf001ConflictType !== 'GENERATED_ACCOUNT_IDENTIFIER') {
    throw error;
  }
  if (attempt < 3) {
    return true;
  }
  throw internalError();
}
async function persistParticipantAccount(connection, input, passwordHash, createdAt, requestContext) {
  const access = resolveParticipantRoleDefaults();
  const identifiers = generateParticipantIdentifiers();
  const userId = await userRepository.createUser(connection, {
    ...identifiers,
    name: input.name,
    email: input.email,
    passwordHash,
    roleId: 'PARTICIPANT',
    roleName: 'PARTICIPANT',
    ...access,
    accountStatus: 'ACTIVE',
    roleAssignedAt: createdAt,
    activatedAt: createdAt,
    authenticationMethod: 'PASSWORD',
    createdAt,
    updatedAt: createdAt
  });
  const participantId = await participantRepository.createParticipant(connection, {
    userId,
    nricPassportNo: input.nricPassportNo,
    name: input.name,
    mobileNo: input.mobileNo,
    createdAt,
    updatedAt: createdAt
  });
  await auditRepository.createParticipantSelfRegistrationAudit(connection, {
    participantId,
    userId,
    createdAt,
    correlationId: requestContext.correlationId,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent
  });
  return participantId;
}
function duplicateAccountError() {
  const error = new Error('The supplied account information cannot be used.');
  error.status = 409;
  error.code = 'ACCOUNT_INFORMATION_CONFLICT';
  return error;
}
function internalError() {
  const error = new Error('An unexpected error occurred.');
  error.status = 500;
  error.code = 'INTERNAL_SERVER_ERROR';
  return error;
}
module.exports = {
  createParticipantAccount
};
