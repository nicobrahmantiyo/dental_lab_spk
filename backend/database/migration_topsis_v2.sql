-- ============================================================
-- migration_topsis_v2.sql (fix: pakai REPLACE INTO)
-- mysql -u root -p nama_database < migration_topsis_v2.sql
-- ============================================================

-- REPLACE INTO = hapus row lama jika code sudah ada, lalu insert baru
REPLACE INTO criteria (code, name, type, weight, description, topsis_type) VALUES
  ('C1', 'Harga',           'COST',    0.4000,
   'Harga per unit (Rp). Rubrik: 1=<=275rb, 2=276-350rb, 3=351-425rb, 4=>425rb',
   'VENDOR'),
  ('C2', 'Kualitas Produk', 'BENEFIT', 0.3000,
   'Flexural Strength (MPa) ISO 6872. Rubrik: 1=<800, 2=800-1000, 3=1001-1200, 4=>1200 MPa',
   'VENDOR'),
  ('C3', 'Lead Time',       'BENEFIT', 0.2000,
   'Waktu pengiriman (hari). Rubrik: 4=1-3hr, 3=4-7hr, 2=8-14hr, 1=>14hr',
   'VENDOR'),
  ('C4', 'Reputasi Vendor', 'BENEFIT', 0.1000,
   'Usia perusahaan/brand (tahun). Rubrik: 1=<3thn, 2=3-7thn, 3=8-15thn, 4=>15thn',
   'VENDOR');

-- Hapus kriteria lama CV1-CV5 kalau masih ada
DELETE FROM criteria WHERE topsis_type = 'VENDOR' AND code NOT IN ('C1','C2','C3','C4');

-- Verifikasi
SELECT id, code, name, type, weight, topsis_type
FROM criteria
WHERE topsis_type = 'VENDOR'
ORDER BY code;