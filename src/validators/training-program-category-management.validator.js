const v = require('./implementation-validation');
function safeId(value) { const id = v.positiveId(value); if (!Number.isSafeInteger(Number(id))) { throw v.bad(); } return id; }
const bodyId = value => { if (typeof value !== 'number') { throw v.bad(); } return safeId(value); };
const integerCapacity = value => { if (!Number.isInteger(value) || value < 1 || value > 2147483647) { throw v.bad(); } return value; };
const fields = {
  name: v.text(200), description: v.text(65535, { bytes: true }), objectives: v.text(65535, { bytes: true }),
  targetAudience: v.text(500), prerequisites: v.nullableText(1000), categoryId: bodyId, trainerUserId: bodyId,
  trainingDate: v.day, startTime: v.time, endTime: v.time, venue: v.nullableText(300), deliveryMode: v.text(50),
  capacity: integerCapacity, registrationOpenAt: v.instant, registrationCloseAt: v.instant,
  status: v.member(['DRAFT','OPEN','CLOSED','COMPLETED','CANCELLED']), cancellationPolicyReference: v.nullableText(255),
  certificateEligibilityCriteria: v.text(100), certificateType: v.nullableText(100)
};
const optional = ['prerequisites','venue','cancellationPolicyReference','certificateType'];
const required = Object.keys(fields).filter(key => !optional.includes(key));
function makeValidators({ errors }) {
  const parse = (path, schema) => v.middleware(req => {
    v.object(req.query, []); v.object(req.params, path ? [path] : []);
    return { ...(path ? { [path]: safeId(req.params[path]) } : {}), ...schema(req.body) };
  }, errors);
  return {
    createProgram: parse(null, v.schema({ code: v.text(50), ...fields }, ['code', ...required.filter(key => key !== 'capacity')])),
    updateProgram: parse('programId', v.schema(fields, required)),
    createCategory: parse(null, v.schema({ name: v.text(150), description: v.nullableText(500), status: v.member(['ACTIVE','INACTIVE']) }, ['name'])),
    updateCategory: parse('categoryId', v.schema({ name: v.text(150), description: v.nullableText(500), status: v.member(['ACTIVE','INACTIVE']) }, ['name','status']))
  };
}
module.exports = { makeValidators, optional };
