function makeController({ service, requestContext, response }) {
  return { endpoint(operation, status) {
    return async (req, res, next) => {
      try {
        const output = await service[operation](req.validatedInput, requestContext(req));
        return res.status(status).json(response.encode(operation, output));
      } catch (error) { return next(error); }
    };
  } };
}
module.exports = { makeController };
