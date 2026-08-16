const express = require('express');
const router = express.Router();
const db = require('../db');

// ─── POST /api/categories ───────────────────────────────────────────
// Admin adds a new category
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    // Generate a simple ID from the name (lowercase, no spaces)
    const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Get the current max displayOrder
    const [rows] = await db.query('SELECT MAX(displayOrder) as maxOrder FROM categories');
    const displayOrder = (rows[0].maxOrder || 0) + 1;

    // Insert the new category
    await db.query(
      'INSERT INTO categories (id, name, displayOrder) VALUES (?, ?, ?)',
      [id, name.trim(), displayOrder]
    );

    res.json({ success: true, category: { id, name: name.trim(), displayOrder } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category already exists' });
    }
    console.error('POST /api/categories error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/categories/reorder ───────────────────────────────────────────
// Admin updates the displayOrder of categories
router.put('/reorder', async (req, res) => {
  const { categories } = req.body;
  if (!Array.isArray(categories)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  try {
    // Perform updates sequentially or in a transaction
    for (const cat of categories) {
      if (cat.id && cat.displayOrder !== undefined) {
        await db.query(
          'UPDATE categories SET displayOrder = ? WHERE id = ?',
          [Number(cat.displayOrder), cat.id]
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/categories/reorder error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
