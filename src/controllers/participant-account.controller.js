const participantAccountService = require('../services/participant-account.service');

async function createParticipantAccount(req, res, next) {
  try {
    const result = await participantAccountService.createParticipantAccount(req.validatedBody, {
      correlationId: req.correlationId, ipAddress: req.ip, userAgent: req.get('user-agent')
    });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = { createParticipantAccount };
