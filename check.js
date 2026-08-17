const db = require('./src/db');
db.query("SELECT * FROM products WHERE name LIKE '%Sparklers%' LIMIT 1").then(([rows]) => {
  console.log(rows);
  process.exit(0);
});
