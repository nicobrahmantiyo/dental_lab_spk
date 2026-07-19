// backend/database/runMigration.js
//
// Jalankan file migration .sql ke database Clever Cloud lewat mysql2
// (Node.js), sebagai alternatif command "mysql" CLI yang bermasalah
// dengan plugin autentikasi di MySQL client versi baru (Mac).
//
// Cara pakai:
//   node database/runMigration.js database/migration_fix_testing_gaps.sql
//   node database/runMigration.js database/migration_add_certifications.sql

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function main() {
  const sqlFile = process.argv[2];
  if (!sqlFile) {
    console.error("❌  Kasih tahu file .sql mana yang mau dijalankan.");
    console.error(
      "    Contoh: node database/runMigration.js database/migration_fix_testing_gaps.sql"
    );
    process.exit(1);
  }

  const fullPath = path.isAbsolute(sqlFile)
    ? sqlFile
    : path.join(__dirname, "..", sqlFile);
  if (!fs.existsSync(fullPath)) {
    console.error("❌  File tidak ditemukan:", fullPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(fullPath, "utf8");

  console.log(
    "🔌  Menghubungkan ke database:",
    process.env.DB_NAME,
    "@",
    process.env.DB_HOST
  );
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true, // wajib true supaya bisa jalankan banyak statement sekaligus dari 1 file
  });

  console.log("🚀  Menjalankan:", path.basename(fullPath), "...\n");
  try {
    const [results] = await connection.query(sql);
    // results bisa berupa array of results (kalau banyak statement) atau 1 object
    const resultArray = Array.isArray(results) ? results : [results];
    resultArray.forEach((r, i) => {
      if (Array.isArray(r)) {
        // hasil SELECT verifikasi
        console.log(`--- Hasil statement #${i + 1} ---`);
        console.table(r);
      }
    });
    console.log("\n✅  Migration selesai dijalankan tanpa error.");
  } catch (err) {
    console.error("\n❌  Error saat menjalankan migration:", err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
