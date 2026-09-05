/* ==========================================================================
   Admin Authentication API Route
   ========================================================================== */

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
  }

  if (db.isMySQL()) {
    try {
      const users = await db.query('SELECT * FROM admin_users WHERE username = ? AND password = ?', [username, password]);
      if (users.length > 0) {
        return res.json({
          success: true,
          token: 'hm31_token_' + Date.now(),
          user: { username: users[0].username, role: users[0].role }
        });
      } else {
        return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
      }
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    // Fallback store check
    const store = db.getDb();
    const found = store.admin_users.find(u => u.username === username && u.password === password);
    if (found || (username === 'admin' && password === 'admin123')) {
      return res.json({
        success: true,
        token: 'hm31_token_' + Date.now(),
        user: { username: username, role: 'admin' }
      });
    } else {
      return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
  }
});

module.exports = router;
