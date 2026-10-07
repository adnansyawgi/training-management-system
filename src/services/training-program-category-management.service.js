const { optional } = require('../validators/training-program-category-management.validator');
function makeService(d) {
  async function program(input, context, updating) {
    return d.transactions.run(async connection => {
      await d.authorization.assertCreator(connection, context);
      const before = updating ? await d.repository.lockProgram(connection, input.programId) : null;
      if (updating && !before) throw d.errors.notFound();
      const next = { ...input, ...(updating ? {} : { capacity: input.capacity ?? 20 }) };
      for (const field of optional) next[field] ??= null;
      await d.repository.assertProgram(connection, before, next);
      const now = d.clock.now();
      const saved = await d.repository.saveProgram(connection, before, next, now);
      const result = d.dto.adminProgram(saved);
      await d.audit.changed(connection, { type: 'PROGRAM', before, saved, context, now });
      return { program: result };
    });
  }
  async function category(input, context, updating) {
    return d.transactions.run(async connection => {
      await d.authorization.assertCreator(connection, context);
      const before = updating ? await d.repository.lockCategory(connection, input.categoryId) : null;
      if (updating && !before) throw d.errors.notFound();
      const next = { ...input, description: input.description ?? null, status: input.status ?? 'ACTIVE' };
      const now = d.clock.now();
      const saved = await d.repository.saveCategory(connection, before, next, now);
      const result = updating ? d.dto.updatedCategory(saved) : d.dto.createdCategory(saved);
      await d.audit.changed(connection, { type: 'CATEGORY', before, saved, context, now });
      return result;
    });
  }
  return { createProgram: (i,c) => program(i,c,false), updateProgram: (i,c) => program(i,c,true),
    createCategory: (i,c) => category(i,c,false), updateCategory: (i,c) => category(i,c,true) };
}
module.exports = { makeService };
