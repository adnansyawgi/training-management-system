// src/utils/implementation-response.js
const {
  positiveId
} = require('../validators/implementation-validation');
function responseValue(value, kind, codec) {
  if (value === undefined) {
    throw new Error('Required response column is absent.');
  }
  switch (kind) {
    case 'id':
      return codec.id(positiveId(value));
    case 'instant':
      return codec.instant(value);
    case 'day':
      return codec.day(value);
    case 'time':
      return codec.time(value);
    case 'number':
      {
        const number = Number(value);
        if (!Number.isFinite(number)) {
          throw new Error('Invalid numeric response.');
        }
        return number;
      }
    default:
      return value;
  }
}
function makeDto(codec) {
  // codec.id must preserve the approved JSON ID representation without rounding.
  // Configure mysql2 supportBigNumbers/bigNumberStrings on the existing pool.
  function project(row, fields) {
    if (!row || typeof row !== 'object') {
      throw new Error('Invalid repository row.');
    }
    const result = {};
    for (const [key, column, kind, nullable = false] of fields) {
      const value = row[column];
      if (value === null) {
        if (!nullable) {
          throw new Error('Required response value is null.');
        }
        result[key] = null;
      } else {
        result[key] = responseValue(value, kind, codec);
      }
    }
    return result;
  }
  return {
    project
  };
}
module.exports = {
  makeDto
};
