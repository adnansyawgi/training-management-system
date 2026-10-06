const app = require('./app');
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Training Management System API listening on port ${port}`));
