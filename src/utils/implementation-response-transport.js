// src/utils/implementation-response-transport.js
function makeResponseTransport(codec, successShapes) {
  const ids = new Set(['userId', 'participantId', 'programId', 'registrationId',
    'categoryId', 'attendanceId', 'certificateId', 'reportExecutionId',
    'issuedBy', 'recordedBy', 'generatedBy']);
  const days = new Set(['trainingDate', 'attendanceDate', 'completionDate', 'issueDate']);
  const times = new Set(['startTime', 'endTime']);
  const instants = new Set(['createdAt', 'updatedAt', 'registeredAt', 'cancelledAt',
    'registrationOpenAt', 'registrationCloseAt', 'expiresAt', 'generatedAt',
    'periodFrom', 'periodTo']);
  function value(key, input) {
    if (input === null) return null;
    if (['page', 'pageSize', 'total'].includes(key)) {
      const number = Number(input);
      if (!Number.isSafeInteger(number) || number < (key === 'total' ? 0 : 1) ||
          key === 'pageSize' && number > 100) throw new Error('Invalid pagination response.');
      return number;
    }
    if (ids.has(key)) return codec.id(input);
    if (days.has(key)) return codec.day(input);
    if (times.has(key)) return codec.time(input);
    if (instants.has(key)) return codec.instant(input);
    if (Array.isArray(input)) return input.map(item => value('', item));
    if (input && typeof input === 'object') {
      return Object.fromEntries(Object.entries(input).map(([k, x]) => [k, value(k, x)]));
    }
    if (typeof input === 'bigint' || input === undefined) throw new Error('Invalid JSON projection.');
    return input;
  }
  return {
    encode(operation, payload) {
      const keys = successShapes[operation];
      if (!keys || !payload || keys.some(key => !Object.hasOwn(payload, key))) {
        throw new Error('Approved success shape is incomplete.');
      }
      return Object.fromEntries(keys.map(key => [key, value(key, payload[key])]));
    }
  };
}
module.exports = { makeResponseTransport };
