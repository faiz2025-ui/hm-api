/* ==========================================================================
   Admin Analytics & Statistics REST API Route
   ========================================================================== */

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/stats - Dashboard analytics
router.get('/', async (req, res) => {
  if (db.isMySQL()) {
    try {
      const [salesRow] = await db.query('SELECT SUM(grand_total) as total_sales FROM orders WHERE status != "ملغى"');
      const [ordersRow] = await db.query('SELECT COUNT(*) as total_orders FROM orders');
      const [pendingRow] = await db.query('SELECT COUNT(*) as pending_orders FROM orders WHERE status = "قيد الانتظار"');
      const [prodsRow] = await db.query('SELECT COUNT(*) as total_products FROM products');
      const [custsRow] = await db.query('SELECT COUNT(DISTINCT phone) as total_customers FROM orders');

      return res.json({
        success: true,
        stats: {
          totalSales: salesRow.total_sales || 0,
          totalOrders: ordersRow.total_orders || 0,
          pendingOrders: pendingRow.pending_orders || 0,
          totalProducts: prodsRow.total_products || 0,
          totalCustomers: custsRow.total_customers || 0
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    const store = db.getDb();
    const totalSales = store.orders.reduce((sum, o) => o.status !== 'ملغى' ? sum + (o.grandTotal || 0) : sum, 0);
    const totalOrders = store.orders.length;
    const pendingOrders = store.orders.filter(o => o.status === 'قيد الانتظار').length;
    const totalProducts = store.products.length;
    const uniquePhones = new Set(store.orders.map(o => o.phone));

    return res.json({
      success: true,
      stats: {
        totalSales: totalSales,
        totalOrders: totalOrders,
        pendingOrders: pendingOrders,
        totalProducts: totalProducts,
        totalCustomers: uniquePhones.size || store.customers.length
      }
    });
  }
});

module.exports = router;
