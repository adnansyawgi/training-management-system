const v = require('./implementation-validation');
function makeValidators({ errors }) {
  const empty = v.schema({}, []);
  const body = v.schema({ username: v.text(100), name: v.text(200), email: v.email,
    password: value => v.password(value, true), role: value => {
      if (!['TRAINING_ADMINISTRATOR', 'TRAINER'].includes(value)) throw errors.forbidden();
      return value;
    }
  }, ['username', 'name', 'email', 'password', 'role']);
  return { create: v.middleware(req => { empty(req.params); empty(req.query); return body(req.body); }, errors) };
}
module.exports = { makeValidators };
