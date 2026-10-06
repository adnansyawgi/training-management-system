require('dotenv').config();

console.log('DB Config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  passwordConfigured: Boolean(process.env.DB_PASSWORD)
});

const app = require('./app');
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Training Management System API listening on port ${port}`));
