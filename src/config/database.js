const mysql = require('mysql2/promise');

// mysql2/promise returns a promise pool; its CommonJS export is otherwise inferred as the callback API.
const pool = /** @type {import('mysql2/promise').Pool & {execute: (sql: string, values?: any[]) => Promise<[import('mysql2').QueryResult, import('mysql2').FieldPacket[]]>}} */ (mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  charset: 'utf8mb4',
  supportBigNumbers: true,
  bigNumberStrings: true,
  timezone: 'Z'
}));

module.exports = pool;
