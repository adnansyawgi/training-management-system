// src/validators/implementation-validation.js
// Shared contract: return canonical decimal identity text internally.
const MAX_ID = 9223372036854775807n;
function positiveId(value) {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value <= 0) throw bad();
    value = String(value);
  }
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value) ||
      value.length > 19 || BigInt(value) > MAX_ID) throw bad();
  return value;
}
function sameId(left, right) { return positiveId(left) === positiveId(right); }
function bad() {
  return Object.assign(new Error('Request information is invalid.'),
    { status: 400, code: 'VALIDATION_ERROR' });
}
function object(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null) throw bad();
  if (Object.keys(value).some(key => !allowed.includes(key))) throw bad();
  return value;
}
function text(max, { trim = true, bytes = false } = {}) {
  return value => {
    if (typeof value !== 'string') throw bad();
    const result = trim ? value.trim() : value;
    const length = bytes ? Buffer.byteLength(result, 'utf8') : Array.from(result).length;
    if (!result || length > max) throw bad();
    return result;
  };
}
function nullableText(max) {
  return value => value === null || value === '' ? null : text(max)(value);
}
function member(values) {
  if (!Array.isArray(values) || !values.length) throw new Error('Enum binding required.');
  return value => { if (!values.includes(value)) throw bad(); return value; };
}
function day(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw bad();
  const parsed = new Date(value + 'T00:00:00.000Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw bad();
  return value;
}
function time(value) {
  if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value)) throw bad();
  return value;
}
function instant(value) {
  // Explicit zone; reject invalid calendar/time values instead of Date rollover.
  if (typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value)) throw bad();
  day(value.slice(0, 10));
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw bad();
  return parsed.toISOString();
}
function email(value) {
  const result = text(254)(value).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw bad();
  return result;
}
function password(value, creation = false) {
  if (typeof value !== 'string' || !value) throw bad();
  if (creation && (value.length < 12 || !/[A-Z]/.test(value) ||
      !/[a-z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9]/.test(value))) throw bad();
  return value; // Never trim; login never re-applies creation complexity.
}
function schema(fields, required) {
  if (required.some(key => !Object.hasOwn(fields, key))) throw new Error('Invalid schema binding.');
  return value => {
    object(value, Object.keys(fields));
    const result = {};
    for (const key of required) if (!Object.hasOwn(value, key)) throw bad();
    for (const [key, rule] of Object.entries(fields)) {
      if (Object.hasOwn(value, key)) result[key] = rule(value[key]);
    }
    return result;
  };
}
function page(query) {
  const page = Number(positiveId(query.page ?? '1'));
  const pageSize = Number(positiveId(query.pageSize ?? '20'));
  if (!Number.isSafeInteger(page) || pageSize > 100 ||
      !Number.isSafeInteger((page - 1) * pageSize)) throw bad();
  return { page, pageSize };
}
function bodyId(value, allowDecimalStrings) {
  if (typeof value === 'string' && !allowDecimalStrings) throw bad();
  return positiveId(value);
}
function middleware(parse, errors) {
  return (req, res, next) => {
    try { req.validatedInput = parse(req); return next(); }
    catch (error) {
      // Convert only validation primitive failures to trusted application errors.
      if (error.status === 400 && error.code === 'VALIDATION_ERROR') return next(errors.validation());
      return next(error);
    }
  };
}
module.exports = { positiveId, sameId, object, text, nullableText, member,
  day, time, instant, email, password, schema, page, bodyId, middleware, bad };
