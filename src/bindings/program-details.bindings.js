const { makeProgramDetailsRepository } = require('../repositories/program-details.repository');
module.exports = { programs: makeProgramDetailsRepository({ pool: require('../config/database') }) };
