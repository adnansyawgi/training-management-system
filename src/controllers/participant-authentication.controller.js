// Feature controller factory. Dependencies are supplied by the composition root.
function makeController({ service, requestContext, response, cookies }) {
  function endpoint(operation, status) {
    return async (req, res, next) => {
      let output;
      try {
        output = await service[operation](req.validatedInput, requestContext(req));
        const json = JSON.stringify(response.encode(operation, output.payload));
        // Commit and serialization completed before any authentication cookie.
        cookies.emitCommitted(res, output.cookiePlan);
        return res.status(status).type('application/json').send(json);
      } catch (error) {
        if (output?.cookiePlan && !res.headersSent) {
          try { await cookies.discardUnsent(res, output.cookiePlan); }
          catch { /* preserve error; adapter logs only sanitized diagnostic */ }
        }
        return next(error);
      }
    };
  }
  return { endpoint };
}
module.exports = { makeController };
