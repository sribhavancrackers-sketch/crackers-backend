const fs = require('fs');
const pool = require('./src/db');

async function migrate() {
  try {
    console.log('Creating products table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(100) PRIMARY KEY,
        productId VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        productName VARCHAR(255),
        category VARCHAR(100),
        sellingPrice DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        originalPrice DECIMAL(10,2),
        oldPrice DECIMAL(10,2),
        discountPercent INT DEFAULT 0,
        inStock BOOLEAN DEFAULT true,
        stock INT DEFAULT 10000,
        availableStock INT DEFAULT 10000,
        quantity INT DEFAULT 10000,
        status VARCHAR(50) DEFAULT 'AVAILABLE',
        imageUrl TEXT,
        youtubeUrl TEXT,
        description TEXT,
        gst INT DEFAULT 3,
        barcode VARCHAR(100),
        qrCode VARCHAR(100),
        branchId VARCHAR(100),
        branchName VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('Reading catalog.json...');
    const catalogData = JSON.parse(fs.readFileSync('../ Crackers new/public/catalog.json', 'utf8'));
    const products = catalogData.products;

    console.log(`Found ${products.length} products. Migrating to MySQL...`);

    for (const p of products) {
      await pool.query(`
        INSERT INTO products (
          id, productId, name, productName, category, sellingPrice, originalPrice, oldPrice,
          discountPercent, inStock, stock, availableStock, quantity, status, imageUrl,
          youtubeUrl, description, gst, barcode, qrCode, branchId, branchName
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          sellingPrice = VALUES(sellingPrice),
          oldPrice = VALUES(oldPrice),
          imageUrl = VALUES(imageUrl)
      `, [
        p.id, p.productId, p.name, p.productName, p.category, p.sellingPrice || 0,
        p.originalPrice, p.oldPrice, p.discountPercent || 0, p.inStock !== false,
        p.stock || 10000, p.availableStock || 10000, p.quantity || 10000,
        p.status || 'AVAILABLE', p.imageUrl || '', p.youtubeUrl || '', p.description || '',
        p.gst || 3, p.barcode || '', p.qrCode || '', p.branchId || '', p.branchName || ''
      ]);
    }
    
    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
