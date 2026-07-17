-- ============================================================
-- migration_handover.sql
-- Menambahkan alur: Verifikasi Pemakaian -> Stok Keluar -> Surat Serah Terima
-- Jalankan: mysql -u root -p nama_database < migration_handover.sql
-- ============================================================

-- 1) Tambah kolom verifikasi pada stock_usage
ALTER TABLE stock_usage
  ADD COLUMN verification_status ENUM('PENDING','VERIFIED','REJECTED') NOT NULL DEFAULT 'PENDING' AFTER item_received,
  ADD COLUMN verified_by   INT UNSIGNED NULL AFTER verification_status,
  ADD COLUMN verified_at   DATETIME NULL AFTER verified_by,
  ADD COLUMN reject_reason VARCHAR(255) NULL AFTER verified_at;

ALTER TABLE stock_usage
  ADD CONSTRAINT fk_usage_verified_by FOREIGN KEY (verified_by) REFERENCES users(id);

-- 2) Tabel header Surat Serah Terima (handover document)
CREATE TABLE handover_documents (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  doc_number       VARCHAR(50)  NOT NULL UNIQUE,
  doc_date         DATE         NOT NULL,
  from_location    VARCHAR(150) NOT NULL DEFAULT 'Gudang Dental Lab',
  to_location      VARCHAR(150) NOT NULL DEFAULT 'Klinik',
  created_by       INT UNSIGNED NOT NULL,
  received_by_name VARCHAR(150),
  notes            TEXT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- 3) Hubungkan stock_transactions ke usage & handover document
ALTER TABLE stock_transactions
  ADD COLUMN usage_id    INT UNSIGNED NULL AFTER material_id,
  ADD COLUMN handover_id INT UNSIGNED NULL AFTER usage_id;

ALTER TABLE stock_transactions
  ADD CONSTRAINT fk_tx_usage    FOREIGN KEY (usage_id)    REFERENCES stock_usage(id),
  ADD CONSTRAINT fk_tx_handover FOREIGN KEY (handover_id) REFERENCES handover_documents(id);

-- 4) Kolom bantu di stock_usage: menyimpan transaksi stok keluar yang dihasilkan
ALTER TABLE stock_usage
  ADD COLUMN stock_out_tx_id INT UNSIGNED NULL AFTER reject_reason;

ALTER TABLE stock_usage
  ADD CONSTRAINT fk_usage_stock_out FOREIGN KEY (stock_out_tx_id) REFERENCES stock_transactions(id);

-- 5) Index bantu
CREATE INDEX idx_usage_verification ON stock_usage(verification_status);
CREATE INDEX idx_tx_handover        ON stock_transactions(handover_id);
