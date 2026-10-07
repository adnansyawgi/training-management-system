const { publicProgramPredicate } = require('./public-program-policy');
const sorts = Object.freeze({ DATE_ASC: 'p.training_date ASC', DATE_DESC: 'p.training_date DESC',
  NAME_ASC: 'p.name ASC', NAME_DESC: 'p.name DESC' });
const seats = 'p.capacity - COALESCE(r.used, 0)';
const source = `FROM training_programs p
  JOIN program_categories c ON c.category_id = p.category_id
  LEFT JOIN (SELECT program_id, COUNT(*) AS used FROM registrations
    WHERE status = 'REGISTERED' GROUP BY program_id) r ON r.program_id = p.program_id`;
function makeCatalogueRepository({ pool }) {
  return {
    async readPage(filter) {
      const sort = sorts[filter.sort];
      if (!sort || !Number.isSafeInteger(filter.offset) || filter.offset < 0 ||
          !Number.isInteger(filter.pageSize) || filter.pageSize < 1 || filter.pageSize > 100) throw new Error('Invalid catalogue binding.');
      const predicates = [publicProgramPredicate];
      const values = [];
      if (filter.categoryId !== undefined) { predicates.push('p.category_id = ?'); values.push(filter.categoryId); }
      if (filter.availability === 'AVAILABLE') predicates.push(`${seats} > 0`);
      else if (filter.availability === 'FULL') predicates.push(`${seats} <= 0`);
      else if (filter.availability !== undefined) throw new Error('Invalid availability binding.');
      const where = 'WHERE ' + predicates.join(' AND ');
      const connection = await pool.getConnection();
      try {
        // Set isolation for this transaction only; avoid changing pooled session defaults.
        await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
        const [count] = await connection.execute(`SELECT COUNT(*) AS total ${source} ${where}`, values);
        const [rows] = await connection.execute(`SELECT p.program_id, p.code, p.name,
          p.category_id, c.name AS category_name, DATE_FORMAT(p.training_date, '%Y-%m-%d') AS training_date,
          TIME_FORMAT(p.start_time, '%H:%i:%s') AS start_time, TIME_FORMAT(p.end_time, '%H:%i:%s') AS end_time,
          p.venue, p.delivery_mode, p.capacity, ${seats} AS available_seats,
          p.status, p.registration_open_at, p.registration_close_at
          ${source} ${where} ORDER BY ${sort}, p.program_id ASC LIMIT ? OFFSET ?`,
        [...values, filter.pageSize, filter.offset]);
        await connection.commit();
        return { rows, total: count[0].total };
      } catch (error) {
        try { await connection.rollback(); } catch { /* preserve original failure */ }
        throw error;
      } finally { connection.release(); }
    },
    async activeCategories() {
      const [rows] = await pool.execute("SELECT category_id, name FROM program_categories WHERE status = 'ACTIVE' ORDER BY name ASC, category_id ASC");
      return rows;
    }
  };
}
module.exports = { makeCatalogueRepository };
