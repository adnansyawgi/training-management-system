const v = require('./implementation-validation');
function makeValidators({ errors }) {
  const empty = v.schema({}, []);
  const body = v.schema({
    staticAdministrationKey: value => value,
    username: v.text(100), name: v.text(200), email: v.email,
    password: value => v.password(value, true)
  }, ['username', 'name', 'email', 'password']);
  return { bootstrap: v.middleware(req => {
    empty(req.params);
    empty(req.query);
    return body(req.body);
  }, errors) };
}
module.exports = { makeValidators };
