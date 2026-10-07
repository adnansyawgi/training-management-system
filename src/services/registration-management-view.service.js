function makeService(d) {
  return {
    async list(input, context) {
      const scope = await d.authorization.operationalScope(context.principal);
      const page = await d.registrations.adminPage(input, scope);
      return { items: page.rows.map(d.dto.adminRegistrationList), page: input.page, pageSize: input.pageSize, total: page.total };
    },
    async detail(input, context) {
      const scope = await d.authorization.operationalScope(context.principal);
      const row = await d.registrations.adminDetail(input.registrationId, scope);
      if (!row) throw d.errors.notFound();
      return d.dto.adminRegistrationDetail(row);
    }
  };
}
module.exports = { makeService };
