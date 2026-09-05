-- ==========================================================================
-- Database Schema for hm_accessoires31 E-Commerce Platform (MySQL)
-- ==========================================================================

CREATE DATABASE IF NOT EXISTS `hm_accessoires31` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hm_accessoires31`;

-- 1. Admin Users Table
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) DEFAULT 'admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Admin User (username: admin, password: admin123)
INSERT INTO `admin_users` (`username`, `password`) 
VALUES ('admin', 'admin123')
ON DUPLICATE KEY UPDATE `username`=`username`;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name_ar` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(50) NOT NULL UNIQUE,
  `icon` VARCHAR(50) DEFAULT 'fa-gem',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Categories
INSERT INTO `categories` (`id`, `name_ar`, `slug`, `icon`) VALUES
('cat-watches', 'الساعات الفاخرة', 'watches', 'fa-clock'),
('cat-bracelets', 'الأساور الراقية', 'bracelets', 'fa-ring'),
('cat-sunglasses', 'النظارات الشمسية', 'sunglasses', 'fa-glasses')
ON DUPLICATE KEY UPDATE `name_ar`=VALUES(`name_ar`);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category_id` VARCHAR(50) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `old_price` DECIMAL(10,2) DEFAULT NULL,
  `badge` VARCHAR(50) DEFAULT NULL,
  `colors` TEXT DEFAULT NULL, -- JSON or comma-separated
  `image_url` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `stock` INT DEFAULT 50,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Sample Products
INSERT INTO `products` (`id`, `title`, `category_id`, `price`, `old_price`, `badge`, `colors`, `image_url`, `description`, `stock`) VALUES
('prod-1', 'ساعة كرونوغراف ذهبية فاخرة HM-Golden Executive', 'cat-watches', 8500.00, 11000.00, 'الأكثر مبيعاً', 'ذهبي ملكي, روز غولد, أسود ذهبي', '/assets/images/watch_gold.jpg', 'ساعة فاخرة متقنة الصنع بزجاج مقاوم للخدش، حزام فولاذي مقاوم للصدأ، آلية حركة كوارتز دقيقة ومقاومة للماء.', 35),
('prod-2', 'ساعة أسود ملكي HM-Obsidian Black Special', 'cat-watches', 9200.00, 12500.00, 'جديد 2026', 'أسود مات, أسود مع عقارب ذهبية', '/assets/images/watch_black.jpg', 'تصميم انسيابي مبهر باللون الأسود الملكي المطفي، يعكس فخامة غامضة ومظهراً هيبة استثنائياً لكل المناسبات.', 20),
('prod-3', 'سوار ذهبي فاخر 18K HM-Cuban Royal', 'cat-bracelets', 4800.00, 6500.00, 'مميز', 'ذهبي نقي 18K, فضي لامع, روز غولد', '/assets/images/bracelet_gold.jpg', 'سوار كوبي فاخر مطلي بالذهب 18 قيراط بتقنية طلاء الكتروني تدوم طويلاً دون تغير اللون.', 50),
('prod-4', 'نظارات شمسية إفياتور ذهبية HM-Gold Aviator 2026', 'cat-sunglasses', 5900.00, 7800.00, 'حصرية', 'إطار ذهبي - عدسات متدرجة, إطار ذهبي - عدسات سوداء', '/assets/images/sunglasses_aviator.jpg', 'نظارة شمسية كلاسيكية بإطار ذهبي مصقول وعدسات مستقطبة UV400 لحماية كاملة للعين من الأشعة الشديدة.', 40),
('prod-5', 'نظارات شمسية أوبسيديان سوداء HM-Obsidian Polarized', 'cat-sunglasses', 6400.00, 8200.00, 'خصم 20%', 'أسود ملكي داكن, أسود مع لمسة ذهبية', '/assets/images/sunglasses_black.jpg', 'تصميم العصري النقي بلمسات الأوبسيديان. خفيفة الوزن على الأنف ومريحة جداً للاستعمال اليومي والقيادة.', 15)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 4. 58 Algerian Wilayas Delivery Rates Table
CREATE TABLE IF NOT EXISTS `delivery_rates` (
  `wilaya_id` VARCHAR(10) PRIMARY KEY,
  `wilaya_name` VARCHAR(100) NOT NULL,
  `stopdesk_fee` DECIMAL(10,2) NOT NULL,
  `home_fee` DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert All 58 Algerian Wilayas Default Shipping Rates
INSERT INTO `delivery_rates` (`wilaya_id`, `wilaya_name`, `stopdesk_fee`, `home_fee`) VALUES
('01', 'أدرار (Adrar)', 700.00, 1000.00),
('02', 'الشلف (Chlef)', 400.00, 600.00),
('03', 'الأغواط (Laghouat)', 500.00, 750.00),
('04', 'أم البواقي (Oum El Bouaghi)', 450.00, 650.00),
('05', 'باتنة (Batna)', 450.00, 650.00),
('06', 'بجاية (Béjaïa)', 400.00, 600.00),
('07', 'بسكرة (Biskra)', 500.00, 750.00),
('08', 'بشار (Béchar)', 650.00, 900.00),
('09', 'البليدة (Blida)', 300.00, 500.00),
('10', 'البويرة (Bouira)', 400.00, 600.00),
('11', 'تمنراست (Tamanrasset)', 800.00, 1200.00),
('12', 'تبسة (Tébessa)', 500.00, 700.00),
('13', 'تلمسان (Tlemcen)', 450.00, 650.00),
('14', 'تيارت (Tiaret)', 450.00, 650.00),
('15', 'تيزي وزو (Tizi Ouzou)', 350.00, 550.00),
('16', 'الجزائر العاصمة (Algiers)', 300.00, 450.00),
('17', 'الجلفة (Djelfa)', 450.00, 700.00),
('18', 'جيجل (Jijel)', 450.00, 650.00),
('19', 'سطيف (Sétif)', 400.00, 600.00),
('20', 'سعيدة (Saïda)', 450.00, 650.00),
('21', 'سكيكدة (Skikda)', 450.00, 650.00),
('22', 'سيدي بلعباس (Sidi Bel Abbès)', 450.00, 650.00),
('23', 'عنابة (Annaba)', 400.00, 600.00),
('24', 'قالمة (Guelma)', 450.00, 650.00),
('25', 'قسنطينة (Constantine)', 400.00, 600.00),
('26', 'المدية (Médéa)', 350.00, 550.00),
('27', 'مستغانم (Mostaganem)', 400.00, 600.00),
('28', 'المسيلة (M\'Sila)', 450.00, 650.00),
('29', 'معسكر (Mascara)', 450.00, 650.00),
('30', 'ورقلة (Ouargla)', 600.00, 850.00),
('31', 'وهران (Oran)', 350.00, 550.00),
('32', 'البيض (El Bayadh)', 600.00, 850.00),
('33', 'إليزي (Illizi)', 800.00, 1200.00),
('34', 'برج بوعريريج (Bordj Bou Arréridj)', 400.00, 600.00),
('35', 'بومرداس (Boumerdès)', 300.00, 500.00),
('36', 'الطارف (El Tarf)', 450.00, 650.00),
('37', 'تندوف (Tindouf)', 850.00, 1300.00),
('38', 'تيسمسيلت (Tissemsilt)', 450.00, 650.00),
('39', 'الوادي (El Oued)', 600.00, 850.00),
('40', 'خنشلة (Khenchela)', 500.00, 700.00),
('41', 'سوق أهراس (Souk Ahras)', 500.00, 700.00),
('42', 'تيبازة (Tipaza)', 300.00, 500.00),
('43', 'ميلة (Mila)', 450.00, 650.00),
('44', 'عين الدفلى (Aïn Defla)', 350.00, 550.00),
('45', 'النعامة (Naâma)', 600.00, 850.00),
('46', 'عين تموشنت (Aïn Témouchent)', 450.00, 650.00),
('47', 'غرداية (Ghardaïa)', 600.00, 850.00),
('48', 'غليزان (Relizane)', 400.00, 600.00),
('49', 'المغير (El M\'Ghair)', 600.00, 850.00),
('50', 'المنيعة (El Meniaa)', 650.00, 900.00),
('51', 'أولاد جلال (Ouled Djellal)', 550.00, 800.00),
('52', 'برج باجي مختار (Bordj Baji Mokhtar)', 900.00, 1400.00),
('53', 'بني عباس (Béni Abbès)', 700.00, 1000.00),
('54', 'تيميمون (Timimoun)', 700.00, 1000.00),
('55', 'تقرت (Touggourt)', 600.00, 850.00),
('56', 'جانت (Djanet)', 850.00, 1300.00),
('57', 'إن صالح (In Salah)', 800.00, 1200.00),
('58', 'إن قزام (In Guezzam)', 900.00, 1400.00)
ON DUPLICATE KEY UPDATE `stopdesk_fee`=VALUES(`stopdesk_fee`);

-- 5. Customers Table
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NOT NULL UNIQUE,
  `wilaya_id` VARCHAR(10) NOT NULL,
  `baladiya` VARCHAR(100) NOT NULL,
  `total_orders` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `customer_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `wilaya_id` VARCHAR(10) NOT NULL,
  `wilaya_name` VARCHAR(100) NOT NULL,
  `baladiya` VARCHAR(100) NOT NULL,
  `delivery_type` ENUM('home', 'stopdesk') NOT NULL,
  `delivery_fee` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `grand_total` DECIMAL(10,2) NOT NULL,
  `status` ENUM('قيد الانتظار', 'تم التأكيد', 'جاري التوصيل', 'تم التسليم', 'ملغى') DEFAULT 'قيد الانتظار',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Order Items Table
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `product_id` VARCHAR(50) NOT NULL,
  `product_title` VARCHAR(255) NOT NULL,
  `color` VARCHAR(50) DEFAULT 'افتراضي',
  `price` DECIMAL(10,2) NOT NULL,
  `quantity` INT NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
