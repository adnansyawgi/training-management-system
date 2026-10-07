const v = require('./implementation-validation');
function makeValidators({ errors }) {
  return { detail: v.middleware(req => {
    v.object(req.params, ['programId']); v.object(req.query, []);
    if (req.body !== undefined) v.object(req.body, []);
    const programId = v.positiveId(req.params.programId);
    if (!Number.isSafeInteger(Number(programId))) throw v.bad();
    return { programId };
  }, errors) };
}
module.exports = { makeValidators };
