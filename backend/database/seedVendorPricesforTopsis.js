// backend/database/seedVendorPricesForTopsis.js
//
// Menambahkan 2-3 harga vendor (dengan nilai kriteria yang bervariasi)
// ke beberapa material sekaligus, supaya banyak material siap dipakai
// untuk analisis TOPSIS tanpa perlu input manual satu-satu lewat form.
//
// Hanya menyentuh material yang BELUM punya >= 2 vendor price aktif
// (aman dijalankan berulang kali, tidak akan menduplikasi material yang
// sudah lengkap datanya).
//
// Cara pakai:
//   node database/seedVendorPricesForTopsis.js         (default: 10 material)
//   node database/seedVendorPricesForTopsis.js 20       (proses 20 material)

const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const LIMIT = parseInt(process.argv[2]) || 10;

// Beberapa profil vendor "virtual" dengan karakteristik berbeda,
// supaya hasil TOPSIS bervariasi (ada yang unggul harga, ada yang
// unggul kualitas, dst) — bukan homogen.
const VENDOR_PROFILES = [
  {
    priceMultiplier: 0.85,
    flexural: 950,
    leadTime: 12,
    reputation: 3,
    certifications: null,
  }, // murah, kualitas standar
  {
    priceMultiplier: 1.0,
    flexural: 1150,
    leadTime: 7,
    reputation: 8,
    certifications: "ISO 6872",
  }, // menengah, seimbang
  {
    priceMultiplier: 1.25,
    flexural: 1350,
    leadTime: 4,
    reputation: 16,
    certifications: "ISO 6872, CE",
  }, // mahal, premium
];

async function main() {
  const pool = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log("🔌  Terhubung ke database:", process.env.DB_NAME, "\n");

  // Ambil vendor yang tersedia (butuh minimal 2)
  const [vendors] = await pool.execute(
    "SELECT id, name FROM vendors WHERE is_active=1 ORDER BY id LIMIT 3"
  );
  if (vendors.length < 2) {
    console.error(
      "❌  Butuh minimal 2 vendor aktif di tabel `vendors`. Tambah vendor dulu lewat aplikasi."
    );
    await pool.end();
    return;
  }
  console.log(
    `📋  Memakai ${vendors.length} vendor:`,
    vendors.map((v) => v.name).join(", "),
    "\n"
  );

  // Cari material yang belum punya >= 2 vendor price aktif
  // Catatan: LIMIT sengaja di-interpolasi langsung (bukan pakai placeholder ?)
  // karena driver mysql2 sering error "Incorrect arguments to mysqld_stmt_execute"
  // saat LIMIT dibind sebagai parameter prepared statement. Aman di sini karena
  // `safeLimit` sudah dipastikan berupa integer positif lewat parseInt di atas.
  const safeLimit = Number.isInteger(LIMIT) && LIMIT > 0 ? LIMIT : 10;
  const [materials] = await pool.execute(`
    SELECT m.id, m.kode_barang, m.nama_barang,
           COUNT(vp.id) AS jumlah_vendor
    FROM materials m
    LEFT JOIN vendor_prices vp ON vp.material_id = m.id AND vp.is_active = 1
    WHERE m.is_active = 1
    GROUP BY m.id
    HAVING jumlah_vendor < 2
    ORDER BY m.id
    LIMIT ${safeLimit}
  `);

  if (materials.length === 0) {
    console.log(
      "✅  Semua material yang dicek sudah punya >= 2 vendor price. Tidak ada yang perlu ditambah."
    );
    await pool.end();
    return;
  }

  console.log(
    `🔧  Menambah data harga vendor untuk ${materials.length} material...\n`
  );

  let totalInserted = 0;

  for (const mat of materials) {
    // Harga dasar acak realistis (150rb - 800rb), supaya tiap material beda
    const basePrice = Math.floor(Math.random() * (800000 - 150000) + 150000);

    // Pakai 2-3 vendor (sesuai jumlah vendor yang tersedia, maks 3)
    const vendorsToUse = vendors.slice(0, Math.min(3, vendors.length));

    for (let i = 0; i < vendorsToUse.length; i++) {
      const vendor = vendorsToUse[i];
      const profile = VENDOR_PROFILES[i % VENDOR_PROFILES.length];
      const price =
        Math.round((basePrice * profile.priceMultiplier) / 1000) * 1000;

      try {
        await pool.execute(
          `INSERT INTO vendor_prices
            (material_id, vendor_id, price_per_unit, flexural_strength, lead_time_days, reputation_years, certifications, is_active)
           VALUES (?,?,?,?,?,?,?,1)`,
          [
            mat.id,
            vendor.id,
            price,
            profile.flexural,
            profile.leadTime,
            profile.reputation,
            profile.certifications,
          ]
        );
        totalInserted++;
      } catch (err) {
        console.error(
          `  ❌  Gagal insert untuk ${mat.kode_barang} / ${vendor.name}:`,
          err.message
        );
      }
    }

    console.log(
      `  ✅  ${mat.kode_barang} — ${mat.nama_barang} (+${vendorsToUse.length} harga vendor)`
    );
  }

  console.log(
    `\n🎉  Selesai. ${totalInserted} baris harga vendor ditambahkan ke ${materials.length} material.`
  );
  console.log(
    "    Sekarang material-material ini siap dianalisis lewat menu TOPSIS di aplikasi."
  );

  await pool.end();
}

main().catch((err) => {
  console.error("\n❌  Error:", err.message);
  process.exit(1);
});
