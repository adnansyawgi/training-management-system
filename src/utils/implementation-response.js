// src/utils/implementation-response.js
const { positiveId } = require('../validators/implementation-validation');
function makeDto(codec) {
  // codec.id must preserve the approved JSON ID representation without rounding.
  // Configure mysql2 supportBigNumbers/bigNumberStrings on the existing pool.
  function project(row, fields) {
    if (!row || typeof row !== 'object') throw new Error('Invalid repository row.');
    const result = {};
    for (const [key, column, kind, nullable = false] of fields) {
      const value = row[column];
      if (value === null) {
        if (!nullable) throw new Error('Required response value is null.');
        result[key] = null;
      } else {
        if (value === undefined) throw new Error('Required response column is absent.');
        if (kind === 'id') result[key] = codec.id(positiveId(value));
        else if (kind === 'instant') result[key] = codec.instant(value);
        else if (kind === 'day') result[key] = codec.day(value);
        else if (kind === 'time') result[key] = codec.time(value);
        else if (kind === 'number') {
          const number = Number(value);
          if (!Number.isFinite(number)) throw new Error('Invalid numeric response.');
          result[key] = number;
        } else result[key] = value;
      }
    }
    return result;
  }
  return { project };
}
module.exports = { makeDto };
