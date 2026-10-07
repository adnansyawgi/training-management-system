const pool = require('../config/database');
const { makeCatalogueRepository } = require('../repositories/program-catalogue.repository');
module.exports = { catalogue: makeCatalogueRepository({ pool }), configuration: require('../config/program-catalogue') };
