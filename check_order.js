const db = require('./src/db');
db.query('DESCRIBE products').then(([rows]) => {
  console.log(rows.map(r => r.Field).join(', '));
  return db.query('SELECT * FROM products LIMIT 5');
}).then(([rows]) => {
  console.log(rows.map(r => r.id + ' | ' + r.name).join('\n'));
  process.exit(0);
});
