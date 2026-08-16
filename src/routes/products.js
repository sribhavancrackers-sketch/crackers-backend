const express = require('express');
const router = express.Router();
const db = require('../db');

// ─── GET /api/products/catalog ──────────────────────────────────────────────────
router.get('/catalog', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.* 
      FROM products p
      LEFT JOIN categories c ON p.category = c.name
      ORDER BY COALESCE(c.displayOrder, 999) ASC, p.displayOrder ASC
    `);
    const products = rows.map(p => ({
      id: p.id,
      productId: p.productId,
      name: p.name,
      productName: p.productName,
      category: p.category,
      sellingPrice: Number(p.sellingPrice),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
      discountPercent: p.discountPercent,
      inStock: Boolean(p.inStock),
      stock: p.stock,
      availableStock: p.availableStock,
      quantity: p.quantity,
      status: p.status,
      imageUrl: p.imageUrl || '',
      youtubeUrl: p.youtubeUrl || '',
      description: p.description || '',
      gst: p.gst,
      barcode: p.barcode || '',
      qrCode: p.qrCode || '',
      branchId: p.branchId || '',
      branchName: p.branchName || '',
    }));
    
    // Fetch categories from the database
    const [catRows] = await db.query('SELECT * FROM categories ORDER BY displayOrder ASC, name ASC');
    const categories = catRows.map(cat => ({
      id: cat.id,
      label: cat.name,
      code: cat.name.substring(0, 3).toUpperCase(),
      displayOrder: cat.displayOrder
    }));

    res.json({ products, categories });
  } catch (err) {
    console.error('GET /api/products/catalog error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/products ──────────────────────────────────────────────────
// Admin adds a new product
router.post('/', async (req, res) => {
  const { name, category, sellingPrice, oldPrice, discountPercent, stock, imageUrl, youtubeUrl } = req.body;
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5); // simple unique id

  try {
    // Get max displayOrder in the category
    const [rows] = await db.query('SELECT MAX(displayOrder) as maxOrder FROM products WHERE category = ?', [category]);
    const displayOrder = (rows[0].maxOrder || 0) + 1;

    await db.query(
      'INSERT INTO products (id, productId, name, productName, category, sellingPrice, oldPrice, discountPercent, stock, imageUrl, youtubeUrl, displayOrder, inStock, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, id, name, name, category, sellingPrice || 0, oldPrice || null, discountPercent || 0, stock || 10000, imageUrl || null, youtubeUrl || null, displayOrder, 1, 1]
    );
    res.json({ success: true, product: { id, productId: id, name, productName: name, category, sellingPrice, oldPrice, discountPercent, stock, imageUrl, youtubeUrl, displayOrder, inStock: true } });
  } catch (err) {
    console.error('POST /api/products error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/products/catalog/:id ───────────────────────────────────────────
// Admin updates a product's details in MySQL
router.put('/catalog/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, sellingPrice, oldPrice, discountPercent, stock, imageUrl, youtubeUrl } = req.body;

  try {
    await db.query(
      'UPDATE products SET name = ?, productName = ?, category = ?, sellingPrice = ?, oldPrice = ?, discountPercent = ?, stock = ?, imageUrl = ?, youtubeUrl = ? WHERE id = ?',
      [name, name, category, sellingPrice, oldPrice || null, discountPercent || 0, stock || 10000, imageUrl || null, youtubeUrl || null, id]
    );
    res.json({ success: true, type: 'mysql' });
  } catch (err) {
    console.error('PUT /api/products/catalog error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/products/bulk-discount ──────────────────────────────────────────
// Admin bulk updates discounts for multiple products
router.put('/bulk-discount', async (req, res) => {
  const { productIds, discountPercent } = req.body;
  if (!Array.isArray(productIds) || typeof discountPercent !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    if (productIds.length === 0) return res.json({ success: true, count: 0 });
    
    const placeholders = productIds.map(() => '?').join(',');
    const [products] = await db.query(`SELECT id, originalPrice, oldPrice, sellingPrice FROM products WHERE id IN (${placeholders})`, productIds);
    
    for (const p of products) {
      // The base price is originalPrice (if it exists), else oldPrice, else sellingPrice.
      const basePrice = Number(p.originalPrice) || Number(p.oldPrice) || Number(p.sellingPrice);
      if (!basePrice) continue;
      
      const newSellingPrice = Math.round(basePrice - (basePrice * (discountPercent / 100)));
      
      await db.query(
        'UPDATE products SET sellingPrice = ?, oldPrice = ?, discountPercent = ? WHERE id = ?',
        [newSellingPrice, basePrice, discountPercent, p.id]
      );
    }

    res.json({ success: true, count: products.length });
  } catch (err) {
    console.error('PUT /api/products/bulk-discount error:', err);
    res.status(500).json({ error: err.message });
  }
});

// We keep the extra endpoints just in case they are still called anywhere temporarily
router.get('/extra', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM extra_products ORDER BY created_at DESC');
    res.json(rows.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      sellingPrice: Number(p.selling_price),
      oldPrice: p.old_price ? Number(p.old_price) : null,
      discountPercent: p.discount_percent,
      stock: p.stock,
      imageUrl: p.image_url || '',
      youtubeUrl: p.youtube_url || '',
      _duplicatedFrom: p.duplicated_from,
      inStock: p.stock > 0,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
