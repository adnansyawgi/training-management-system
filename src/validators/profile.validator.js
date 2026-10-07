const v = require('./implementation-validation');
function editableFields(role) { return role === 'PARTICIPANT' ? ['email', 'mobileNo'] : ['email']; }
function parseProfileUpdate(body, role, errors) {
  try {
    const allowed = editableFields(role);
    v.object(body, allowed);
    if (!Object.keys(body).length) throw v.bad();
    const result = {};
    if (Object.hasOwn(body, 'email')) result.email = v.email(body.email);
    if (Object.hasOwn(body, 'mobileNo')) result.mobileNo = v.text(30)(body.mobileNo);
    return result;
  } catch (error) {
    if (error.status === 400 && error.code === 'VALIDATION_ERROR') throw errors.validation();
    throw error;
  }
}
module.exports = { editableFields, parseProfileUpdate };
