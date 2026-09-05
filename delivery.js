/* ==========================================================================
   58 Algerian Wilayas Delivery Rates REST API Route
   ========================================================================== */

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/delivery - List 58 Wilayas & Fees
router.get('/', async (req, res) => {
  if (db.isMySQL()) {
    try {
      const rows = await db.query('SELECT * FROM delivery_rates ORDER BY CAST(wilaya_id AS UNSIGNED) ASC');
      return res.json({ success: true, wilayas: rows });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    const store = db.getDb();
    return res.json({ success: true, wilayas: store.delivery_rates });
  }
});

// PUT /api/delivery/:wilaya_id - Update Shipping Rates for a Wilaya
router.put('/:wilaya_id', async (req, res) => {
  const { wilaya_id } = req.params;
  const { stopdesk_fee, home_fee } = req.body;

  if (stopdesk_fee === undefined || home_fee === undefined) {
    return res.status(400).json({ success: false, message: 'أسعار المكتب والمنزل مطلوبة' });
  }

  const sFee = parseFloat(stopdesk_fee);
  const hFee = parseFloat(home_fee);
  const wInt = parseInt(wilaya_id);

  if (db.isMySQL()) {
    try {
      await db.query(
        'UPDATE delivery_rates SET stopdesk_fee = ?, home_fee = ? WHERE wilaya_id = ? OR CAST(wilaya_id AS UNSIGNED) = ?',
        [sFee, hFee, wilaya_id, wInt]
      );
      return res.json({ success: true, message: 'تم تحديث أسعار التوصيل بنجاح' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    const store = db.getDb();
    const w = store.delivery_rates.find(x => x.wilaya_id == wilaya_id || parseInt(x.wilaya_id) == wInt);
    if (w) {
      w.stopdesk_fee = sFee;
      w.home_fee = hFee;
      w.stopdesk = sFee;
      w.home = hFee;
      db.saveDb();
      return res.json({ success: true, message: 'تم تحديث أسعار التوصيل بنجاح' });
    } else {
      return res.status(404).json({ success: false, message: 'الولاية غير موجودة' });
    }
  }
});

module.exports = router;
