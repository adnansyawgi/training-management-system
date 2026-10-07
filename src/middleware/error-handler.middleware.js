const { makeErrorHandler } = require('./implementation-errors');
module.exports = makeErrorHandler([400, 401, 403, 404, 409, 423, 500], { wf001Compatibility: true });
