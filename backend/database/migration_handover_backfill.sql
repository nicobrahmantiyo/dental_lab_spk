-- ============================================================
-- migration_handover_backfill.sql
-- JALANKAN SEKALI, SEGERA SETELAH migration_handover.sql,
-- SEBELUM ada input pemakaian baru dari teknisi.
--
-- Tujuan: menandai data stock_usage yang SUDAH ADA sebelumnya
-- (stoknya sudah terpotong lewat logika lama) sebagai
-- "sudah selesai diproses", supaya TIDAK ikut kena potong stok
-- lagi lewat flow verifikasi/Stok Keluar yang baru.
--
-- Aman dijalankan lebih dari sekali (idempotent) karena hanya
-- menyasar baris yang belum punya stock_out_tx_id.
-- ============================================================

-- 1) Buat catatan transaksi retroaktif (bukti bahwa barang ini
--    sudah "keluar" sebelumnya), tanpa mengubah current_stock
--    material (karena stoknya sudah terpotong duluan).
INSERT INTO stock_transactions
  (material_id, usage_id, user_id, transaction_type, quantity, note, transaction_date)
SELECT
  su.material_id,
  su.id,
  su.user_id,
  'OUT',
  (su.qty_of_usage - IFNULL(su.qty_of_return, 0)),
  'Migrasi data lama - stok sudah terpotong sebelum fitur verifikasi aktif',
  su.created_at
FROM stock_usage su
WHERE su.stock_out_tx_id IS NULL
  AND su.verification_status = 'PENDING';

-- 2) Tandai baris stock_usage lama tersebut sebagai VERIFIED
--    dan sudah "diproses" (terhubung ke transaksi di atas),
--    supaya tidak lagi muncul di daftar "menunggu verifikasi"
--    ataupun daftar "siap diproses jadi Stok Keluar".
UPDATE stock_usage su
JOIN stock_transactions st
  ON st.usage_id = su.id
 AND st.handover_id IS NULL
SET su.verification_status = 'VERIFIED',
    su.verified_by         = su.user_id,
    su.verified_at         = su.created_at,
    su.stock_out_tx_id     = st.id
WHERE su.stock_out_tx_id IS NULL;

-- 3) Verifikasi hasil (harus 0 baris "PENDING" palsu yang sebenarnya lama)
SELECT verification_status, COUNT(*) AS jumlah
FROM stock_usage
GROUP BY verification_status;
