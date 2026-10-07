const v = require('./implementation-validation');
function makeValidators({ errors }) {
  const empty = v.schema({}, []);
  function parse(path, body, query = empty) {
    const pathSchema = v.schema(path, Object.keys(path));
    return v.middleware(req => ({ ...pathSchema(req.params),
      ...query(req.query), ...(body ? body(req.body) : {}) }), errors);
  }
  // ISO outputs are UTC and compare lexically after v.instant normalization.
  const login = v.schema({ email: v.email,
    password: value => v.password(value) }, ['email', 'password']);
  return { login: parse({}, login) };
}
module.exports = { makeValidators };
