const v = require('./implementation-validation');
function safeId(value) {
  const id = v.positiveId(value);
  if (!Number.isSafeInteger(Number(id))) throw v.bad();
  return id;
}
function makeValidators({ errors, sortKeys, defaultSort }) {
  const sort = v.member(sortKeys); sort(defaultSort);
  function emptyBody(req) { if (req.body !== undefined) v.object(req.body, []); }
  return {
    list: v.middleware(req => {
      v.object(req.params, []); emptyBody(req);
      v.object(req.query, ['periodFrom','periodTo','programId','categoryId','participantId','status','page','pageSize','sort']);
      if (Object.values(req.query).some(value => typeof value !== 'string')) throw v.bad();
      const input = { ...v.page(req.query), sort: req.query.sort === undefined ? defaultSort : sort(req.query.sort) };
      for (const key of ['programId','categoryId','participantId']) if (req.query[key] !== undefined) input[key] = safeId(req.query[key]);
      for (const key of ['periodFrom','periodTo']) if (req.query[key] !== undefined) input[key] = v.instant(req.query[key]);
      if (input.periodFrom && input.periodTo && input.periodFrom >= input.periodTo) throw v.bad();
      if (req.query.status !== undefined) input.status = v.member(['REGISTERED','CANCELLED'])(req.query.status);
      return input;
    }, errors),
    detail: v.middleware(req => {
      v.object(req.params, ['registrationId']); v.object(req.query, []); emptyBody(req);
      return { registrationId: safeId(req.params.registrationId) };
    }, errors)
  };
}
module.exports = { makeValidators };
