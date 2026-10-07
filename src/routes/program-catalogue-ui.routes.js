const express = require('express');
const ui = require('../config/ui');
const { makeResponseCodec } = require('../utils/implementation-response-codec');
function makePageRouter({ catalogue, configuration }) {
  const router = express.Router();
  const codec = makeResponseCodec();
  router.get(ui.programListUrl, async (req, res, next) => {
    try {
      const categories = (await catalogue.activeCategories()).map(row => ({ categoryId: codec.id(row.category_id), name: row.name }));
      return res.render('programs/program-list', { ...ui, categories, availabilityOptions: configuration.availabilityOptions });
    } catch (error) { return next(error); }
  });
  return router;
}
module.exports = { makePageRouter };
