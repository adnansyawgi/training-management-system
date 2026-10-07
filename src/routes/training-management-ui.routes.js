const express = require('express');
const ui = require('../config/ui'),
  v = require('../validators/implementation-validation');
const {
  errors
} = require('../auth/authentication-errors');
const {
  makeResponseCodec
} = require('../utils/implementation-response-codec');
const {
  makeFeatureDto
} = require('../repositories/training-program-category-management.dto');
const {
  localDateTime
} = require('../public/js/business-time');
async function editingRecord(bindings, codec, dto, kind, id) {
  if (id === undefined) {
    return null;
  }
  codec.id(v.positiveId(id));
  const row = await bindings.repository[kind === 'programs' ? 'getProgram' : 'getCategory'](id);
  if (!row) {
    throw errors.notFound();
  }
  return kind === 'programs' ? dto.adminProgram(row) : dto.createdCategory(row);
}
function makePageRouter(bindings) {
  const router = express.Router(),
    codec = makeResponseCodec(),
    dto = makeFeatureDto(codec);
  for (const [url, kind] of [[ui.trainingAdministratorLandingUrl, 'programs'], [ui.categoryManagementUrl, 'categories']]) {
    router.get(url, bindings.security.requireSession, bindings.security.requireRole('TRAINING_ADMINISTRATOR'), async (req, res, next) => {
      try {
        v.object(req.query, kind === 'programs' ? ['page', 'pageSize', 'edit', 'categoryPage', 'trainerPage'] : ['page', 'pageSize', 'edit']);
        if (Object.values(req.query).some(value => typeof value !== 'string')) {
          return next(errors.validation());
        }
        const {
          page,
          pageSize
        } = v.page(req.query);
        const result = await bindings.repository.page(kind, page, pageSize);
        const timezone = process.env.BUSINESS_TIMEZONE || 'Asia/Kuala_Lumpur';
        new Intl.DateTimeFormat('en', {
          timeZone: timezone
        }).resolvedOptions();
        const editing = await editingRecord(bindings, codec, dto, kind, req.query.edit);
        const model = {
          ...ui,
          csrfToken: res.locals.csrfToken,
          kind,
          businessTimezone: timezone,
          editing,
          page,
          pageSize,
          total: result.total,
          records: result.rows.map(kind === 'programs' ? dto.adminProgram : dto.createdCategory),
          localDateTime: value => localDateTime(value, timezone)
        };
        if (kind === 'programs') {
          const categoryPage = v.page({
            page: req.query.categoryPage ?? '1',
            pageSize: '100'
          }).page;
          const trainerPage = v.page({
            page: req.query.trainerPage ?? '1',
            pageSize: '100'
          }).page;
          const categories = await bindings.repository.page('categories', categoryPage, 100),
            trainers = await bindings.repository.page('trainers', trainerPage, 100);
          model.categories = categories.rows.map(dto.createdCategory);
          model.trainers = trainers.rows.map(row => ({
            userId: codec.id(row.user_id),
            name: row.name
          }));
          model.categoryPage = categoryPage;
          model.trainerPage = trainerPage;
          model.categoryTotal = categories.total;
          model.trainerTotal = trainers.total;
        }
        model.link = changes => url + '?' + new URLSearchParams({
          ...req.query,
          ...changes
        }).toString();
        res.render(kind === 'programs' ? 'admin/program-management' : 'admin/category-management', model);
      } catch (error) {
        next(error.status === 400 && error.code === 'VALIDATION_ERROR' ? errors.validation() : error);
      }
    });
  }
  return router;
}
module.exports = {
  makePageRouter
};
