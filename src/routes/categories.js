const express = require('express');
const router = express.Router();
const db = require('../db');

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
