/* ==========================================================================
   Categories REST API Route
   ========================================================================== */

const express = require('express');
const router = express.Router();
const db = require('./db');

// GET /api/categories
router.get('/', async (req, res) => {
  if (db.isMySQL()) {
    try {
      const rows = await db.query('SELECT * FROM categories');
      return res.json({ success: true, categories: rows });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    const store = db.getDb();
    return res.json({ success: true, categories: store.categories });
  }
});

// POST /api/categories - Add Category
router.post('/', async (req, res) => {
  const { name_ar, slug, icon } = req.body;
  if (!name_ar || !slug) {
    return res.status(400).json({ success: false, message: 'يرجى إدخال اسم الفئة والاسم المختصر' });
  }

  const id = `cat-${slug}`;
  if (db.isMySQL()) {
    try {
      await db.query('INSERT INTO categories (id, name_ar, slug, icon) VALUES (?, ?, ?, ?)', [id, name_ar, slug, icon || 'fa-gem']);
      return res.json({ success: true, message: 'تمت إضافة الفئة بنجاح' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    const store = db.getDb();
    store.categories.push({ id, name_ar, slug, icon: icon || 'fa-gem' });
    db.saveDb();
    return res.json({ success: true, message: 'تمت إضافة الفئة بنجاح' });
  }
});

module.exports = router;
