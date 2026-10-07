// src/utils/implementation-response-codec.js
const v = require('../validators/implementation-validation');
function numericId(value) {
  const number = Number(v.positiveId(value));
  if (!Number.isSafeInteger(number)) {
    throw new TypeError('Approved lossless JSON ID binding required.');
  }
  return number;
}
function decimalId(value) {
  return v.positiveId(value);
}
function approvedId(value) {
  const canonical = v.positiveId(value);
  const encode = Number.isSafeInteger(Number(canonical)) ? numericId : decimalId;
  return encode(canonical);
}
function makeResponseCodec({
  decimalStringResponseApproved = false
} = {}) {
  return {
    id: decimalStringResponseApproved ? approvedId : numericId,
    instant(value) {
      if (value instanceof Date && Number.isFinite(value.getTime())) {
        return value.toISOString();
      }
      if (typeof value !== 'string') {
        throw new TypeError('Invalid UTC timestamp.');
      }
      // SDD DATETIME timestamps represent UTC; do not apply business timezone twice.
      const input = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d{1,3})?$/.test(value) ? value.replace(' ', 'T') + 'Z' : value;
      return v.instant(input);
    },
    day: v.day,
    time: v.time
  };
}
module.exports = {
  makeResponseCodec
};
