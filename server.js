/* ==========================================================================
   hm-accessoires31 - Main Express Server Gateway & Static File Provider
   ========================================================================== */

const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploads Folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register API Routes
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/products', require('./server/routes/products'));
app.use('/api/categories', require('./server/routes/categories'));
app.use('/api/orders', require('./server/routes/orders'));
app.use('/api/delivery', require('./server/routes/delivery'));
app.use('/api/stats', require('./server/routes/stats'));

// Serve Admin Panel at /admin Route
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Serve Public Customer Website at Root Route /
app.use('/', express.static(path.join(__dirname, 'public')));

// Catch-all route for SPA navigation fallback
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`=================================================================`);
  console.log(`🚀 hm-accessoires31 E-Commerce Server Running!`);
  console.log(`🌐 Customer Website URL : http://localhost:${PORT}/`);
  console.log(`🔒 Admin Panel URL      : http://localhost:${PORT}/admin/index.html`);
  console.log(`=================================================================`);
});
