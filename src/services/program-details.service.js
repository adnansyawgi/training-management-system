function makeService({ programs, dto, errors }) {
  return { async detail({ programId }) {
    const row = await programs.findPublicDetail(programId);
    if (!row) throw errors.notFound();
    return dto.programDetail(row);
  } };
}
module.exports = { makeService };
