const v = require('./implementation-validation');
function makeValidators({ errors, sortKeys, defaultSort }) {
  const sort = v.member(sortKeys); sort(defaultSort);
  return {
    list: v.middleware(req => {
      v.object(req.params, []); v.object(req.query, ['page','pageSize','status','sort']);
      if (Object.values(req.query).some(value => typeof value !== 'string')) throw v.bad();
      if (req.body !== undefined) v.object(req.body, []);
      const result = { ...v.page(req.query), sort: req.query.sort === undefined ? defaultSort : sort(req.query.sort) };
      if (req.query.status !== undefined) result.status = v.member(['REGISTERED','CANCELLED'])(req.query.status);
      return result;
    }, errors),
    cancel: v.middleware(req => {
      v.object(req.params, ['registrationId']); v.object(req.query, []);
      const registrationId = v.positiveId(req.params.registrationId);
      if (!Number.isSafeInteger(Number(registrationId))) throw v.bad();
      const body = v.schema({ cancellationReason: v.nullableText(500) }, [])(req.body ?? {});
      return { registrationId, ...body };
    }, errors)
  };
}
module.exports = { makeValidators };
