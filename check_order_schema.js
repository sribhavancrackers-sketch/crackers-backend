const db = require('./src/db');
db.query('DESCRIBE orders').then(([rows]) => {
  console.log(rows.map(r => r.Field).join(', '));
  process.exit(0);
});
