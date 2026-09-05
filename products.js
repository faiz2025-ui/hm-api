/* ==========================================================================
   Products REST API Route & Multer File Upload Handler
   ========================================================================== */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');

// Multer Storage Setup for Product Image Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'prod-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// POST /api/products/upload - File Upload Endpoint
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'لم يتم اختيار أي ملف لرفعه' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  return res.json({ success: true, imageUrl: imageUrl });
});

// GET /api/products - List all products
router.get('/', async (req, res) => {
  const { category, search } = req.query;

  if (db.isMySQL()) {
    try {
      let queryStr = 'SELECT * FROM products WHERE is_active = 1';
      const queryParams = [];

      if (category && category !== 'all') {
        const cleanCat = category.replace('cat-', '').toLowerCase();
        queryStr += ' AND (LOWER(category_id) = ? OR LOWER(category_id) = ?)';
        queryParams.push(cleanCat, 'cat-' + cleanCat);
      }

      if (search) {
        queryStr += ' AND (title LIKE ? OR description LIKE ?)';
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      queryStr += ' ORDER BY created_at DESC';
      const rows = await db.query(queryStr, queryParams);
      
      const formatted = rows.map(r => ({
        ...r,
        category: (r.category_id || '').replace('cat-', ''),
        colors: r.colors ? (Array.isArray(r.colors) ? r.colors : r.colors.split(',').map(c => c.trim())) : ['ذهبي'],
        images: [r.image_url]
      }));

      return res.json({ success: true, products: formatted });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    // Fallback Data Store
    const store = db.getDb();
    let prods = [...store.products];

    if (category && category !== 'all') {
      const cleanCat = category.replace('cat-', '').toLowerCase();
      prods = prods.filter(p => {
        const pCat = (p.category_id || p.category || '').replace('cat-', '').toLowerCase();
        return pCat === cleanCat;
      });
    }

    if (search) {
      prods = prods.filter(p => 
        p.title.toLowerCase().includes(search.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      );
    }

    const formatted = prods.map(p => ({
      ...p,
      category: (p.category_id || p.category || 'watches').replace('cat-', ''),
      colors: Array.isArray(p.colors) ? p.colors : (p.colors ? p.colors.split(',').map(c => c.trim()) : ['ذهبي']),
      images: Array.isArray(p.images) ? p.images : [p.image_url || '/assets/images/watch_gold.jpg']
    }));

    return res.json({ success: true, products: formatted });
  }
});

// POST /api/products - Create Product
router.post('/', async (req, res) => {
  const { title, category, price, oldPrice, colors, imageUrl, description, badge, stock } = req.body;

  if (!title || !price) {
    return res.status(400).json({ success: false, message: 'يرجى إدخال اسم المنتج والسعر' });
  }

  const id = `prod-${Date.now()}`;
  const cleanCat = (category || 'watches').replace('cat-', '');
  const catId = `cat-${cleanCat}`;
  const colorsStr = Array.isArray(colors) ? colors.join(', ') : (colors || 'ذهبي');
  const image = imageUrl || '/assets/images/watch_gold.jpg';

  if (db.isMySQL()) {
    try {
      await db.query(
        `INSERT INTO products (id, title, category_id, price, old_price, badge, colors, image_url, description, stock) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, title, catId, price, oldPrice || null, badge || 'جديد', colorsStr, image, description || '', stock || 50]
      );
      return res.json({ success: true, message: 'تمت إضافة المنتج بنجاح', productId: id });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    const store = db.getDb();
    const newProd = {
      id: id,
      title: title,
      category_id: catId,
      category: cleanCat,
      price: parseFloat(price),
      old_price: oldPrice ? parseFloat(oldPrice) : null,
      badge: badge || 'جديد',
      colors: Array.isArray(colors) ? colors : colorsStr.split(',').map(c => c.trim()),
      image_url: image,
      images: [image],
      description: description || '',
      stock: stock || 50,
      is_active: 1
    };

    store.products.unshift(newProd);
    db.saveDb();
    return res.json({ success: true, message: 'تمت إضافة المنتج بنجاح', product: newProd });
  }
});

// PUT /api/products/:id - Edit Product Price / Details
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { price, title, colors, stock, description, category } = req.body;

  const cleanCat = category ? category.replace('cat-', '') : null;
  const catId = cleanCat ? `cat-${cleanCat}` : null;

  if (db.isMySQL()) {
    try {
      await db.query(
        'UPDATE products SET price = COALESCE(?, price), title = COALESCE(?, title), category_id = COALESCE(?, category_id), colors = COALESCE(?, colors), stock = COALESCE(?, stock) WHERE id = ?',
        [price, title, catId, Array.isArray(colors) ? colors.join(', ') : colors, stock, id]
      );
      return res.json({ success: true, message: 'تم تحديث البيانات بنجاح' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    const store = db.getDb();
    const prod = store.products.find(p => p.id === id);
    if (prod) {
      if (price !== undefined) prod.price = parseFloat(price);
      if (title !== undefined) prod.title = title;
      if (cleanCat !== null) {
        prod.category_id = catId;
        prod.category = cleanCat;
      }
      if (colors !== undefined) prod.colors = Array.isArray(colors) ? colors : colors.split(',').map(c => c.trim());
      if (stock !== undefined) prod.stock = parseInt(stock);
      if (description !== undefined) prod.description = description;
      db.saveDb();
      return res.json({ success: true, message: 'تم تحديث بيانات المنتج بنجاح' });
    } else {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }
  }
});

// DELETE /api/products/:id - Delete Product
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (db.isMySQL()) {
    try {
      await db.query('DELETE FROM products WHERE id = ?', [id]);
      return res.json({ success: true, message: 'تم حذف المنتج' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    const store = db.getDb();
    store.products = store.products.filter(p => p.id !== id);
    db.saveDb();
    return res.json({ success: true, message: 'تم حذف المنتج' });
  }
});

module.exports = router;
