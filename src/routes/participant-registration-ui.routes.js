const express = require('express');
const ui = require('../config/ui');
const { errors } = require('../auth/authentication-errors');
const { makeValidators } = require('../validators/participant-program-registration.validator');
const { makeFeatureDto } = require('../repositories/program-details.dto');
const { makeResponseCodec } = require('../utils/implementation-response-codec');
function makePageRouter(bindings, programs) {
  const router = express.Router(), dto = makeFeatureDto(makeResponseCodec());
  router.get(ui.programRegistrationUrlTemplate, bindings.security.requireSession, bindings.security.requireRole('PARTICIPANT'),
    makeValidators({ errors }).page, async (req, res, next) => {
      try {
        const row = await programs.findPublicDetail(req.validatedInput.programId);
        if (!row) throw errors.notFound();
        const participant = await bindings.repository.profile(req.principal.userId);
        res.render('registrations/registration-confirmation', { ...ui, participant, program: dto.programDetail(row),
          csrfToken: res.locals.csrfToken, programDetailsUrl: ui.programDetailsBaseUrl + '/' + req.validatedInput.programId });
      } catch (error) { next(error); }
    });
  return router;
}
module.exports = { makePageRouter };
