-- ============================================================
-- migration_add_certifications.sql
-- Menambahkan kolom `certifications` ke tabel vendor_prices,
-- yang dipakai oleh vendorPriceController.js tapi belum pernah
-- dibuat di schema.sql maupun migration manapun sebelumnya.
--
-- Aman dijalankan berulang kali (idempotent) — cek dulu apakah
-- kolom sudah ada sebelum menambahkannya.
--
-- Jalankan lewat phpMyAdmin Clever Cloud (tab Import), atau:
--   mysql -u USER -p -h HOST -P PORT DBNAME < migration_add_certifications.sql
-- ============================================================

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'vendor_prices'
    AND COLUMN_NAME = 'certifications'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE vendor_prices ADD COLUMN certifications VARCHAR(255) DEFAULT NULL AFTER reputation_years',
  'SELECT "Kolom certifications sudah ada, dilewati" AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verifikasi
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_prices'
  AND COLUMN_NAME = 'certifications';