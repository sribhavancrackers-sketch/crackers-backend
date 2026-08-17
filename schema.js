const pool = require('./src/db');
async function run() {
  const [tables] = await pool.query('SHOW TABLES');
  for (const table of tables) {
    const tableName = Object.values(table)[0];
    console.log(`Table: ${tableName}`);
    const [cols] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
    console.log(cols);
  }
  process.exit(0);
}
run();
