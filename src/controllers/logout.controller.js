function makeController({ sessions }) {
  return async (req, res) => {
    await sessions.invalidate(req.authenticatedSessionId);
    sessions.clearCookie(res);
    res.status(204).end();
  };
}
module.exports = { makeController };
