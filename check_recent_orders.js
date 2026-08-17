const db = require('./src/db');
db.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 1').then(([rows]) => {
  console.log(rows);
  process.exit(0);
});
