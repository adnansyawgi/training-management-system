const ui = require('../config/ui');
const { getMenu, resolveDestination } = require('../services/navigation.service');
function makeController({ service, requestContext }) {
  return {
    async page(req, res) {
      const profile = await service.getOwnProfile(req.principal);
      res.render('profile/profile', { ...ui, ownProfile: profile, navigation: getMenu(req.principal), dashboardUrl: resolveDestination(req.principal.role) });
    },
    async get(req, res) { res.json(await service.getOwnProfile(req.principal)); },
    async update(req, res) { res.json(await service.updateOwnProfile(req.principal, req.body, requestContext(req))); }
  };
}
module.exports = { makeController };
