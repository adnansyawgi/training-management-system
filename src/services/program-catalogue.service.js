function makeService({ catalogue, dto }) {
  return { async list(filter) {
    const result = await catalogue.readPage({ ...filter, offset: (filter.page - 1) * filter.pageSize });
    return { items: result.rows.map(dto.programList), page: filter.page, pageSize: filter.pageSize, total: result.total };
  } };
}
module.exports = { makeService };
