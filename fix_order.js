const fs = require('fs');
const pool = require('./src/db');

async function fix() {
  try {
    console.log('Adding displayOrder column...');
    await pool.query('ALTER TABLE products ADD COLUMN displayOrder INT DEFAULT 0');
  } catch (e) {
    if (!e.message.includes('Duplicate column')) {
      console.error(e);
    }
  }

  const catalog = JSON.parse(fs.readFileSync('../ Crackers new/public/catalog.json', 'utf8'));
  console.log(`Updating ${catalog.products.length} products...`);
  
  for (let i = 0; i < catalog.products.length; i++) {
    const p = catalog.products[i];
    await pool.query('UPDATE products SET displayOrder = ? WHERE id = ?', [i + 1, p.id]);
  }
  
  console.log('Done!');
  process.exit(0);
}
fix();
