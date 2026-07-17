-- ROLES (3 role sesuai permintaan kamu)
INSERT IGNORE INTO roles (name, label) VALUES
  ('admin',      'Admin Inventori'),
  ('technician', 'Teknisi'),
  ('manager',    'Manager');

-- BRANDS
INSERT IGNORE INTO brands (name) VALUES
  ('Deprag'),
  ('Welldent'),
  ('Haohua'),
  ('Yihua'),
  ('EVE'),
  ('Dentex'),
  ('Vita'),
  ('Sofu');

-- VENDORS
INSERT IGNORE INTO vendors (name, brand_id, lead_time_days) VALUES
  ('Deprag Official',     1, 3),
  ('No Brand Supplier',   2, 7),
  ('Welldent Indonesia',    3, 5),
  ('Sofu Indonesia', 4, 7),
  ('Vita',       5, 7),
  ('Sofu Indonesia',    6, 5);

-- MATERIAL CATEGORIES
INSERT INTO material_categories (name, description) VALUES
  ('Abutment',      'Komponen abutment untuk implant'),
  ('Analog',        'Analog implant untuk model gigi'),
  ('Disc Zircone',  'Disc zirkonia untuk crown dan bridge'),
  ('Ceramic Glass', 'Ceramic glass layer material'),
  ('Implant',       'Material implant tanam'),
  ('Milling Bur',   'Bur untuk proses milling'),
  ('Lainnya',       'Material lainnya');

-- CRITERIA TOPSIS MATERIAL
INSERT INTO criteria (code, name, type, weight, description, topsis_type) VALUES
  ('CM1', 'Frekuensi Pemakaian',  'BENEFIT', 0.30, 'Seberapa sering material dipakai teknisi',  'MATERIAL'),
  ('CM2', 'Selisih Stok Minimum', 'COST',    0.25, 'Seberapa kritis stok saat ini vs minimum',  'MATERIAL'),
  ('CM3', 'Harga per Unit',       'COST',    0.20, 'Harga beli material',                       'MATERIAL'),
  ('CM4', 'Lead Time',            'COST',    0.15, 'Waktu tunggu pengiriman dari vendor (hari)', 'MATERIAL'),
  ('CM5', 'Masa Simpan',          'BENEFIT', 0.10, 'Umur simpan bahan baku dalam bulan',        'MATERIAL');

-- CRITERIA TOPSIS VENDOR
INSERT INTO criteria (code, name, type, weight, description, topsis_type) VALUES
  ('CV1', 'Harga per Unit',    'COST',    0.30, 'Harga yang ditawarkan vendor',               'VENDOR'),
  ('CV2', 'Skor Kualitas',     'BENEFIT', 0.25, 'Penilaian kualitas produk dari vendor 0-100','VENDOR'),
  ('CV3', 'Ketersediaan Stok', 'BENEFIT', 0.20, 'Jumlah stok tersedia di vendor',             'VENDOR'),
  ('CV4', 'Lead Time',         'COST',    0.15, 'Waktu pengiriman dari vendor (hari)',         'VENDOR'),
  ('CV5', 'Masa Simpan',       'BENEFIT', 0.10, 'Umur simpan produk dari vendor (bulan)',     'VENDOR');