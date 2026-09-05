/* ==========================================================================
   hm-accessoires31 - Database Connection Pool & Data Abstraction Layer
   ========================================================================== */

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Environment variables or defaults
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;
const DB_PORT = process.env.DB_PORT || 19192;

let pool = null;
let useMySQL = false;

// Fallback File Database Storage (Memory + JSON persistence)
const DATA_FILE = path.join(__dirname, '../../data_store.json');

// Initial Fallback Seed State
let memoryDb = {
  admin_users: [{ id: 1, username: 'admin', password: 'admin123' }],
  categories: [
    { id: 'cat-watches', name_ar: 'الساعات الفاخرة', slug: 'watches', icon: 'fa-clock' },
    { id: 'cat-bracelets', name_ar: 'الأساور الراقية', slug: 'bracelets', icon: 'fa-ring' },
    { id: 'cat-sunglasses', name_ar: 'النظارات الشمسية', slug: 'sunglasses', icon: 'fa-glasses' }
  ],
  products: [
    {
      id: 'prod-1',
      title: 'ساعة كرونوغراف ذهبية فاخرة HM-Golden Executive',
      category_id: 'cat-watches',
      price: 8500,
      old_price: 11000,
      badge: 'الأكثر مبيعاً',
      colors: 'ذهبي ملكي, روز غولد, أسود ذهبي',
      image_url: '/assets/images/watch_gold.jpg',
      description: 'ساعة فاخرة متقنة الصنع بزجاج مقاوم للخدش، حزام فولاذي مقاوم للصدأ، آلية حركة كوارتز دقيقة ومقاومة للماء.',
      stock: 35,
      is_active: 1
    },
    {
      id: 'prod-2',
      title: 'ساعة أسود ملكي HM-Obsidian Black Special',
      category_id: 'cat-watches',
      price: 9200,
      old_price: 12500,
      badge: 'جديد 2026',
      colors: 'أسود مات, أسود مع عقارب ذهبية',
      image_url: '/assets/images/watch_black.jpg',
      description: 'تصميم انسيابي مبهر باللون الأسود الملكي المطفي، يعكس فخامة غامضة ومظهراً هيبة استثنائياً لكل المناسبات.',
      stock: 20,
      is_active: 1
    },
    {
      id: 'prod-3',
      title: 'سوار ذهبي فاخر 18K HM-Cuban Royal',
      category_id: 'cat-bracelets',
      price: 4800,
      old_price: 6500,
      badge: 'مميز',
      colors: 'ذهبي نقي 18K, فضي لامع, روز غولد',
      image_url: '/assets/images/bracelet_gold.jpg',
      description: 'سوار كوبي فاخر مطلي بالذهب 18 قيراط بتقنية طلاء الكتروني تدوم طويلاً دون تغير اللون.',
      stock: 50,
      is_active: 1
    },
    {
      id: 'prod-4',
      title: 'نظارات شمسية إفياتور ذهبية HM-Gold Aviator 2026',
      category_id: 'cat-sunglasses',
      price: 5900,
      old_price: 7800,
      badge: 'حصرية',
      colors: 'إطار ذهبي - عدسات متدرجة, إطار ذهبي - عدسات سوداء',
      image_url: '/assets/images/sunglasses_aviator.jpg',
      description: 'نظارة شمسية كلاسيكية بإطار ذهبي مصقول وعدسات مستقطبة UV400 لحماية كاملة للعين من الأشعة الشديدة.',
      stock: 40,
      is_active: 1
    },
    {
      id: 'prod-5',
      title: 'نظارات شمسية أوبسيديان سوداء HM-Obsidian Polarized',
      category_id: 'cat-sunglasses',
      price: 6400,
      old_price: 8200,
      badge: 'خصم 20%',
      colors: 'أسود ملكي داكن, أسود مع لمسة ذهبية',
      image_url: '/assets/images/sunglasses_black.jpg',
      description: 'تصميم العصري النقي بلمسات الأوبسيديان. خفيفة الوزن على الأنف ومريحة جداً للاستعمال اليومي والقيادة.',
      stock: 15,
      is_active: 1
    }
  ],
  delivery_rates: [
    { wilaya_id: "01", wilaya_name: "أدرار (Adrar)", stopdesk_fee: 700, home_fee: 1000 },
    { wilaya_id: "02", wilaya_name: "الشلف (Chlef)", stopdesk_fee: 400, home_fee: 600 },
    { wilaya_id: "03", wilaya_name: "الأغواط (Laghouat)", stopdesk_fee: 500, home_fee: 750 },
    { wilaya_id: "04", wilaya_name: "أم البواقي (Oum El Bouaghi)", stopdesk_fee: 450, home_fee: 650 },
    { wilaya_id: "05", wilaya_name: "باتنة (Batna)", stopdesk_fee: 450, home_fee: 650 },
    { wilaya_id: "06", wilaya_name: "بجاية (Béjaïa)", stopdesk_fee: 400, home_fee: 600 },
    { wilaya_id: "07", wilaya_name: "بسكرة (Biskra)", stopdesk_fee: 500, home_fee: 750 },
    { wilaya_id: "08", wilaya_name: "بشار (Béchar)", stopdesk_fee: 650, home_fee: 900 },
    { wilaya_id: "09", wilaya_name: "البليدة (Blida)", stopdesk_fee: 300, home_fee: 500 },
    { wilaya_id: "10", wilaya_name: "البويرة (Bouira)", stopdesk_fee: 400, home_fee: 600 },
    { wilaya_id: "11", wilaya_name: "تمنراست (Tamanrasset)", stopdesk_fee: 800, home_fee: 1200 },
    { wilaya_id: "12", wilaya_name: "تبسة (Tébessa)", stopdesk_fee: 500, home_fee: 700 },
    { wilaya_id: "13", wilaya_name: "تلمسان (Tlemcen)", stopdesk_fee: 450, home_fee: 650 },
    { wilaya_id: "14", wilaya_name: "تيارت (Tiaret)", stopdesk_fee: 450, home_fee: 650 },
    { wilaya_id: "15", wilaya_name: "تيزي وزو (Tizi Ouzou)", stopdesk_fee: 350, home_fee: 550 },
    { wilaya_id: "16", wilaya_name: "الجزائر العاصمة (Algiers)", stopdesk_fee: 300, home_fee: 450 },
    { wilaya_id: "17", wilaya_name: "الجلفة (Djelfa)", stopdesk_fee: 450, home_fee: 700 },
    { wilaya_id: "18", wilaya_name: "جيجل (Jijel)", stopdesk_fee: 450, home_fee: 650 },
    { wilaya_id: "19", wilaya_name: "سطيف (Sétif)", stopdesk_fee: 400, home_fee: 600 },
    { wilaya_id: "20", wilaya_name: "سعيدة (Saïda)", stopdesk_fee: 450, home_fee: 650 },
    { wilaya_id: "21", wilaya_name: "سكيكدة (Skikda)", stopdesk_fee: 450, home_fee: 650 },
    { wilaya_id: "22", wilaya_name: "سيدي بلعباس (Sidi Bel Abbès)", stopdesk_fee: 450, home_fee: 650 },
    { wilaya_id: "23", wilaya_name: "عنابة (Annaba)", stopdesk_fee: 400, home_fee: 600 },
    { wilaya_id: "24", wilaya_name: "قالمة (Guelma)", stopdesk_fee: 450, home_fee: 650 },
    { wilaya_id: "25", wilaya_name: "قسنطينة (Constantine)", stopdesk_fee: 400, home_fee: 600 },
    { wilaya_id: "26", wilaya_name: "المدية (Médéa)", stopdesk_fee: 350, home_fee: 550 },
    { wilaya_id: "27", wilaya_name: "مستغانم (Mostaganem)", stopdesk_fee: 400, home_fee: 600 },
    { wilaya_id: "28", wilaya_name: "المسيلة (M'Sila)", stopdesk_fee: 450, home_fee: 650 },
    { wilaya_id: "29", wilaya_name: "معسكر (Mascara)", stopdesk_fee: 450, home_fee: 650 },
    { wilaya_id: "30", wilaya_name: "ورقلة (Ouargla)", stopdesk_fee: 600, home_fee: 850 },
    { wilaya_id: "31", wilaya_name: "وهران (Oran)", stopdesk_fee: 350, home_fee: 550 },
    { wilaya_id: "32", wilaya_name: "البيض (El Bayadh)", stopdesk_fee: 600, home_fee: 850 },
    { wilaya_id: "33", wilaya_name: "إليزي (Illizi)", stopdesk_fee: 800, home_fee: 1200 },
    { wilaya_id: "34", wilaya_name: "برج بوعريريج (Bordj Bou Arréridj)", stopdesk_fee: 400, home_fee: 600 },
    { wilaya_id: "35", wilaya_name: "بومرداس (Boumerdès)", stopdesk_fee: 300, home_fee: 500 },
    { wilaya_id: "36", wilaya_name: "الطارف (El Tarf)", stopdesk_fee: 450, home_fee: 650 },
    { wilaya_id: "37", wilaya_name: "تندوف (Tindouf)", stopdesk_fee: 850, home_fee: 1300 },
    { wilaya_id: "38", wilaya_name: "تيسمسيلت (Tissemsilt)", stopdesk_fee: 450, home_fee: 650 },
    { wilaya_id: "39", wilaya_name: "الوادي (El Oued)", stopdesk_fee: 600, home_fee: 850 },
    { wilaya_id: "40", wilaya_name: "خنشلة (Khenchela)", stopdesk_fee: 500, home_fee: 700 },
    { wilaya_id: "41", wilaya_name: "سوق أهراس (Souk Ahras)", stopdesk_fee: 500, home_fee: 700 },
    { wilaya_id: "42", wilaya_name: "تيبازة (Tipaza)", stopdesk_fee: 300, home_fee: 500 },
    { wilaya_id: "43", wilaya_name: "ميلة (Mila)", stopdesk_fee: 450, home_fee: 650 },
    { wilaya_id: "44", wilaya_name: "عين الدفلى (Aïn Defla)", stopdesk_fee: 350, home_fee: 550 },
    { wilaya_id: "45", wilaya_name: "النعامة (Naâma)", stopdesk_fee: 600, home_fee: 850 },
    { wilaya_id: "46", wilaya_name: "عين تموشنت (Aïn Témouchent)", stopdesk_fee: 450, home_fee: 650 },
    { wilaya_id: "47", wilaya_name: "غرداية (Ghardaïa)", stopdesk_fee: 600, home_fee: 850 },
    { wilaya_id: "48", wilaya_name: "غليزان (Relizane)", stopdesk_fee: 400, home_fee: 600 },
    { wilaya_id: "49", wilaya_name: "المغير (El M'Ghair)", stopdesk_fee: 600, home_fee: 850 },
    { wilaya_id: "50", wilaya_name: "المنيعة (El Meniaa)", stopdesk_fee: 650, home_fee: 900 },
    { wilaya_id: "51", wilaya_name: "أولاد جلال (Ouled Djellal)", stopdesk_fee: 550, home_fee: 800 },
    { wilaya_id: "52", wilaya_name: "برج باجي مختار (Bordj Baji Mokhtar)", stopdesk_fee: 900, home_fee: 1400 },
    { wilaya_id: "53", wilaya_name: "بني عباس (Béni Abbès)", stopdesk_fee: 700, home_fee: 1000 },
    { wilaya_id: "54", wilaya_name: "تيميمون (Timimoun)", stopdesk_fee: 700, home_fee: 1000 },
    { wilaya_id: "55", wilaya_name: "تقرت (Touggourt)", stopdesk_fee: 600, home_fee: 850 },
    { wilaya_id: "56", wilaya_name: "جانت (Djanet)", stopdesk_fee: 850, home_fee: 1300 },
    { wilaya_id: "57", wilaya_name: "إن صالح (In Salah)", stopdesk_fee: 800, home_fee: 1200 },
    { wilaya_id: "58", wilaya_name: "إن قزام (In Guezzam)", stopdesk_fee: 900, home_fee: 1400 }
  ],
  customers: [],
  orders: []
};

// Load saved JSON store if exists
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    memoryDb = JSON.parse(raw);
  } catch (e) {
    console.log("Could not load data_store.json, using defaults.");
  }
}

function saveMemoryDb() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(memoryDb, null, 2), 'utf8');
}

// Init Database connection
async function initDb() {
  try {
   pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: { rejectUnauthorized: false }
    });
    

    // Test connection
    const conn = await pool.getConnection();
    conn.release();
    useMySQL = true;
    console.log(`✅ MySQL Connected successfully to database: ${DB_NAME}`);
  } catch (err) {
    console.log(`⚠️  MySQL connection not available (${err.message}). Using built-in JSON/Memory Data Store for seamless execution.`);
    useMySQL = false;
  }
}

// Database helper functions abstraction
const db = {
  isMySQL: () => useMySQL,
  
  // Generic Query wrapper
  async query(sql, params = []) {
    if (useMySQL && pool) {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } else {
      // Fallback handlers
      return memoryDb;
    }
  },

  getDb: () => memoryDb,
  saveDb: saveMemoryDb
};

initDb();

module.exports = db;
