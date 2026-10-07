// src/utils/implementation-response-codec.js
const v = require('../validators/implementation-validation');
function makeResponseCodec({ decimalStringResponseApproved = false } = {}) {
  return {
    id(value) {
      const canonical = v.positiveId(value);
      const number = Number(canonical);
      if (Number.isSafeInteger(number)) return number;
      if (decimalStringResponseApproved) return canonical;
      throw new Error('Approved lossless JSON ID binding required.');
    },
    instant(value) {
      if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
      if (typeof value !== 'string') throw new Error('Invalid UTC timestamp.');
      // SDD DATETIME timestamps represent UTC; do not apply business timezone twice.
      const input = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d{1,3})?$/.test(value)
        ? value.replace(' ', 'T') + 'Z' : value;
      return v.instant(input);
    },
    day: v.day, time: v.time
  };
}
module.exports = { makeResponseCodec };
