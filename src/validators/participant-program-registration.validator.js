const v = require('./implementation-validation');
function safeId(value) {
  const id = v.positiveId(value);
  if (!Number.isSafeInteger(Number(id))) throw v.bad();
  return id;
}
function makeValidators({ errors }) {
  return { register: v.middleware(req => {
    v.object(req.params, []); v.object(req.query, []);
    const parse = v.schema({ programId: value => {
      if (typeof value !== 'number') throw v.bad();
      return safeId(value);
    } }, ['programId']);
    return parse(req.body);
  }, errors), page: v.middleware(req => {
    v.object(req.params, ['programId']); v.object(req.query, []);
    return { programId: safeId(req.params.programId) };
  }, errors) };
}
module.exports = { makeValidators };
