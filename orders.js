/* ==========================================================================
   Orders REST API Route
   ========================================================================== */

const express = require('express');
const router = express.Router();
const db = require('./db');

// GET /api/orders - List all orders (Admin)
router.get('/', async (req, res) => {
  if (db.isMySQL()) {
    try {
      const orders = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
      for (let o of orders) {
        const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
        o.items = items;
      }
      return res.json({ success: true, orders: orders });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    const store = db.getDb();
    return res.json({ success: true, orders: store.orders });
  }
});

// POST /api/orders - Place customer order
router.post('/', async (req, res) => {
  const { name, phone, wilayaId, baladiya, deliveryType, items } = req.body;

  if (!name || !phone || !wilayaId || !baladiya || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'جميع البيانات والمنتجات مطلوبة لإتمام الطلب' });
  }

  // Calculate fees
  let wilayaObj = null;
  let fee = 500;
  let wilayaName = `ولاية ${wilayaId}`;

  if (db.isMySQL()) {
    try {
      const wRows = await db.query('SELECT * FROM delivery_rates WHERE wilaya_id = ?', [wilayaId]);
      if (wRows.length > 0) {
        wilayaObj = wRows[0];
        wilayaName = wilayaObj.wilaya_name;
        fee = deliveryType === 'home' ? parseFloat(wilayaObj.home_fee) : parseFloat(wilayaObj.stopdesk_fee);
      }
    } catch (err) {
      console.log('Wilaya lookup error:', err);
    }
  } else {
    const store = db.getDb();
    wilayaObj = store.delivery_rates.find(w => w.wilaya_id === wilayaId);
    if (wilayaObj) {
      wilayaName = wilayaObj.wilaya_name;
      fee = deliveryType === 'home' ? wilayaObj.home_fee : wilayaObj.stopdesk_fee;
    }
  }

  let subtotal = 0;
  items.forEach(i => {
    subtotal += parseFloat(i.price) * parseInt(i.qty || i.quantity || 1);
  });

  const grandTotal = subtotal + fee;
  const orderNumber = `#HM31-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

  if (db.isMySQL()) {
    try {
      const resOrder = await db.query(
        `INSERT INTO orders (order_number, customer_name, phone, wilaya_id, wilaya_name, baladiya, delivery_type, delivery_fee, subtotal, grand_total, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'قيد الانتظار')`,
        [orderNumber, name, phone, wilayaId, wilayaName, baladiya, deliveryType, fee, subtotal, grandTotal]
      );

      const orderId = resOrder.insertId;

      for (let item of items) {
        await db.query(
          `INSERT INTO order_items (order_id, product_id, product_title, color, price, quantity) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.id || 'prod-1', item.title, item.color || 'افتراضي', item.price, item.qty || item.quantity || 1]
        );
      }

      return res.json({
        success: true,
        message: 'تم تسجيل الطلب بنجاح',
        order: {
          id: orderNumber,
          customerName: name,
          phone: phone,
          wilaya: wilayaName,
          baladiya: baladiya,
          deliveryType: deliveryType === 'home' ? 'توصيل للمنزل' : 'توصيل للمكتب (Stop Desk)',
          deliveryFee: fee,
          subtotal: subtotal,
          grandTotal: grandTotal,
          items: items,
          date: orderDate
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    const store = db.getDb();
    const newOrder = {
      id: orderNumber,
      customerName: name,
      phone: phone,
      wilaya: wilayaName,
      baladiya: baladiya,
      deliveryType: deliveryType === 'home' ? 'توصيل للمنزل' : 'توصيل للمكتب (Stop Desk)',
      deliveryFee: fee,
      subtotal: subtotal,
      grandTotal: grandTotal,
      items: items,
      status: 'قيد الانتظار',
      date: orderDate
    };

    store.orders.unshift(newOrder);
    
    // Register customer if new
    if (!store.customers.find(c => c.phone === phone)) {
      store.customers.push({
        id: store.customers.length + 1,
        name: name,
        phone: phone,
        wilaya: wilayaName,
        baladiya: baladiya,
        total_orders: 1
      });
    }

    db.saveDb();

    return res.json({
      success: true,
      message: 'تم تسجيل الطلب بنجاح',
      order: newOrder
    });
  }
});

// PUT /api/orders/:id/status - Update Order Status
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'الحالة الجديدة مطلوبة' });
  }

  if (db.isMySQL()) {
    try {
      await db.query('UPDATE orders SET status = ? WHERE order_number = ? OR id = ?', [status, id, id]);
      return res.json({ success: true, message: 'تم تحديث حالة الطلب بنجاح' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    const store = db.getDb();
    const order = store.orders.find(o => o.id === id || o.id === `#${id}`);
    if (order) {
      order.status = status;
      db.saveDb();
      return res.json({ success: true, message: 'تم تحديث حالة الطلب بنجاح' });
    } else {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }
  }
});

module.exports = router;
