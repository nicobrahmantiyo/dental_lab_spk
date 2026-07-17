SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS topsis_detail_results;
DROP TABLE IF EXISTS topsis_results;
DROP TABLE IF EXISTS stock_usage;
DROP TABLE IF EXISTS stock_transactions;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS material_categories;
DROP TABLE IF EXISTS criteria;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- ROLES
CREATE TABLE roles (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL UNIQUE,
  label      VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- USERS
CREATE TABLE users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id     INT UNSIGNED NOT NULL,
  username    VARCHAR(100) NOT NULL UNIQUE,
  full_name   VARCHAR(150) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  is_active   TINYINT(1)   DEFAULT 1,
  last_login  DATETIME,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- BRANDS (Upcera, No Brand, Osstem, dll)
CREATE TABLE brands (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- VENDORS (untuk perbandingan TOPSIS fungsi 2)
CREATE TABLE vendors (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  brand_id      INT UNSIGNED,
  contact_person VARCHAR(150),
  phone         VARCHAR(50),
  email         VARCHAR(150),
  address       TEXT,
  lead_time_days INT DEFAULT 0,
  is_active     TINYINT(1) DEFAULT 1,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id)
) ENGINE=InnoDB;

-- MATERIAL CATEGORIES (Abutment, Analog, Disc Zircone, dll)
CREATE TABLE material_categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- MATERIALS (Master Bahan Baku dari Beginning Stock)
CREATE TABLE materials (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id      INT UNSIGNED,
  brand_id         INT UNSIGNED,
  kode_barang      VARCHAR(50)   NOT NULL UNIQUE,
  nama_barang      VARCHAR(255)  NOT NULL,
  unit             VARCHAR(30)   NOT NULL DEFAULT 'pcs',
  beginning_stock  DECIMAL(12,2) DEFAULT 0,
  current_stock    DECIMAL(12,2) DEFAULT 0,
  min_stock        DECIMAL(12,2) DEFAULT 1,
  price_per_unit   DECIMAL(15,2) DEFAULT 0,
  lead_time_days   INT           DEFAULT 0,
  shelf_life_months INT          DEFAULT 0,
  is_active        TINYINT(1)    DEFAULT 1,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES material_categories(id),
  FOREIGN KEY (brand_id)    REFERENCES brands(id)
) ENGINE=InnoDB;

-- VENDOR PRICES (harga material per vendor, untuk TOPSIS fungsi 2)
CREATE TABLE vendor_prices (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  material_id    INT UNSIGNED   NOT NULL,
  vendor_id      INT UNSIGNED   NOT NULL,
  price_per_unit DECIMAL(15,2)  NOT NULL,
  quality_score  DECIMAL(5,2)   DEFAULT 0,
  shelf_life_months INT         DEFAULT 0,
  lead_time_days INT            DEFAULT 0,
  is_active      TINYINT(1)     DEFAULT 1,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (vendor_id)   REFERENCES vendors(id)
) ENGINE=InnoDB;

-- STOCK TRANSACTIONS (Stok Masuk)
CREATE TABLE stock_transactions (
  id               INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
  material_id      INT UNSIGNED     NOT NULL,
  vendor_id        INT UNSIGNED,
  user_id          INT UNSIGNED     NOT NULL,
  transaction_type ENUM('IN','OUT') NOT NULL,
  quantity         DECIMAL(12,2)    NOT NULL,
  price_per_unit   DECIMAL(15,2)    DEFAULT 0,
  batch_number     VARCHAR(100),
  note             TEXT,
  transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (vendor_id)   REFERENCES vendors(id),
  FOREIGN KEY (user_id)     REFERENCES users(id)
) ENGINE=InnoDB;

-- STOCK USAGE (Pemakaian per Pasien dari Report Usage Tanam)
CREATE TABLE stock_usage (
  id               INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  material_id      INT UNSIGNED  NOT NULL,
  user_id          INT UNSIGNED  NOT NULL,
  sub_uniq_id      VARCHAR(100),
  patient_name     VARCHAR(200),
  doctor_name      VARCHAR(200),
  qty_of_usage     DECIMAL(12,2) NOT NULL,
  qty_of_return    DECIMAL(12,2) DEFAULT 0,
  item_received    TINYINT(1)    DEFAULT 0,
  ket_trial_revisi VARCHAR(100),
  notes            TEXT,
  month_of_usage   VARCHAR(20),
  usage_date       DATE          NOT NULL,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (user_id)     REFERENCES users(id)
) ENGINE=InnoDB;

-- CRITERIA TOPSIS
CREATE TABLE criteria (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(20)  NOT NULL UNIQUE,
  name        VARCHAR(150) NOT NULL,
  type        ENUM('BENEFIT','COST') NOT NULL,
  weight      DECIMAL(5,4) NOT NULL,
  description TEXT,
  topsis_type ENUM('MATERIAL','VENDOR') NOT NULL DEFAULT 'MATERIAL',
  is_active   TINYINT(1)   DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TOPSIS RESULTS
CREATE TABLE topsis_results (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  analyzed_by       INT UNSIGNED NOT NULL,
  topsis_type       ENUM('MATERIAL','VENDOR') NOT NULL DEFAULT 'MATERIAL',
  material_id       INT UNSIGNED,
  title             VARCHAR(255),
  note              TEXT,
  criteria_snapshot JSON,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analyzed_by)  REFERENCES users(id),
  FOREIGN KEY (material_id)  REFERENCES materials(id)
) ENGINE=InnoDB;

CREATE TABLE topsis_detail_results (
  id               INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  result_id        INT UNSIGNED  NOT NULL,
  material_id      INT UNSIGNED,
  vendor_id        INT UNSIGNED,
  ranking          INT           NOT NULL,
  preference_score DECIMAL(10,6) NOT NULL,
  d_positive       DECIMAL(10,6),
  d_negative       DECIMAL(10,6),
  raw_values       JSON,
  normalized_matrix JSON,
  weighted_matrix  JSON,
  FOREIGN KEY (result_id)   REFERENCES topsis_results(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (vendor_id)   REFERENCES vendors(id)
) ENGINE=InnoDB;

-- NOTIFICATIONS
CREATE TABLE notifications (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED,
  role_target VARCHAR(50),
  type        ENUM('LOW_STOCK','REQUEST','INFO','WARNING') DEFAULT 'INFO',
  title       VARCHAR(255) NOT NULL,
  message     TEXT         NOT NULL,
  material_id INT UNSIGNED,
  is_read     TINYINT(1)   DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- INDEXES
CREATE INDEX idx_materials_kode      ON materials(kode_barang);
CREATE INDEX idx_materials_stock     ON materials(current_stock, min_stock);
CREATE INDEX idx_stock_usage_date    ON stock_usage(usage_date);
CREATE INDEX idx_stock_usage_patient ON stock_usage(patient_name);
CREATE INDEX idx_stock_tx_material   ON stock_transactions(material_id);
CREATE INDEX idx_notif_role          ON notifications(role_target, is_read);