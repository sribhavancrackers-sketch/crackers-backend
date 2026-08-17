const mysql = require('mysql2/promise');
const fs = require('fs');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'mysql-118dc290-sribhavancrackers-358f.e.aivencloud.com',
      port: 10212,
      user: 'avnadmin',
      password: 'AVNS_FreWb9ien7NS1gkM64-',
      database: 'defaultdb',
      ssl: { rejectUnauthorized: false }
    });
    console.log('Connected to Aiven!');

    // Read and execute schema
    const schemaSql = fs.readFileSync('schema.sql', 'utf8');
    const statements = schemaSql.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }
    console.log('Schema created!');
    
    await connection.end();
  } catch (err) {
    console.error('Error:', err);
  }
}
testConnection();
