const v = require('./implementation-validation');
function makeQueryParser({ availabilityValues, sortKeys, defaultSort }) {
  const availability = v.member(availabilityValues);
  const sort = v.member(sortKeys);
  sort(defaultSort);
  return query => {
    v.object(query, ['page', 'pageSize', 'categoryId', 'availability', 'sort']);
    if (Object.values(query).some(value => typeof value !== 'string')) throw v.bad();
    const result = { ...v.page(query), sort: query.sort === undefined ? defaultSort : sort(query.sort) };
    if (query.categoryId !== undefined) {
      result.categoryId = v.positiveId(query.categoryId);
      if (!Number.isSafeInteger(Number(result.categoryId))) throw v.bad();
    }
    if (query.availability !== undefined) result.availability = availability(query.availability);
    return result;
  };
}
function makeValidators({ errors, configuration }) {
  const parse = makeQueryParser(configuration);
  return { list: v.middleware(req => {
    v.object(req.params, []);
    if (req.body !== undefined) v.object(req.body, []);
    return parse(req.query);
  }, errors) };
}
module.exports = { makeQueryParser, makeValidators };
