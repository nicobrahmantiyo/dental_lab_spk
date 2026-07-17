-- ============================================================
-- migration_fix_testing_gaps_v2.sql
-- Versi AMAN DIJALANKAN ULANG (idempotent) dari
-- migration_fix_testing_gaps.sql — cek dulu apakah kolom/tabel
-- sudah ada sebelum menambahkannya, supaya tidak error
-- "Duplicate column name" / "Table already exists" kalau
-- sebagian sudah pernah dijalankan sebelumnya.
--
-- Jalankan:
--   mysql -u root -p dental_db < database/migration_fix_testing_gaps_v2.sql
-- ============================================================

-- 1) Tambah kolom flexural_strength ke vendor_prices, KALAU BELUM ADA
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'vendor_prices'
    AND COLUMN_NAME = 'flexural_strength'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE vendor_prices ADD COLUMN flexural_strength DECIMAL(8,2) DEFAULT 0 AFTER quality_score',
  'SELECT "Kolom flexural_strength sudah ada, dilewati" AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Tambah kolom reputation_years ke vendor_prices, KALAU BELUM ADA
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'vendor_prices'
    AND COLUMN_NAME = 'reputation_years'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE vendor_prices ADD COLUMN reputation_years INT DEFAULT 0 AFTER lead_time_days',
  'SELECT "Kolom reputation_years sudah ada, dilewati" AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Buat tabel purchase_requests, KALAU BELUM ADA (Tabel 3.20 BAB III)
CREATE TABLE IF NOT EXISTS purchase_requests (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_no        VARCHAR(50)   NOT NULL UNIQUE,
  requested_by      INT UNSIGNED  NOT NULL,
  material_id       INT UNSIGNED  NOT NULL,
  qty_requested     DECIMAL(12,2) NOT NULL,
  note              TEXT,
  status            ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  approved_by       INT UNSIGNED,
  note_approval     TEXT,
  topsis_result_id  INT UNSIGNED,
  requested_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at      DATETIME NULL,
  FOREIGN KEY (requested_by)     REFERENCES users(id),
  FOREIGN KEY (material_id)      REFERENCES materials(id),
  FOREIGN KEY (approved_by)      REFERENCES users(id),
  FOREIGN KEY (topsis_result_id) REFERENCES topsis_results(id)
) ENGINE=InnoDB;

-- 4) Verifikasi hasil akhir
SELECT COLUMN_NAME, DATA_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_prices'
  AND COLUMN_NAME IN ('flexural_strength', 'reputation_years');

SHOW TABLES LIKE 'purchase_requests';