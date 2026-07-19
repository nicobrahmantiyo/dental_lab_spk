// backend/database/importUsageFast.js
// Versi optimized dari importReportUsage() di importCSV.js
// - Preload semua kode_barang -> id ke memori (1 query, bukan 1 query per baris)
// - Batch insert per 500 baris (bukan 1 insert per baris)
// - Print progress tiap batch
//
// PENTING: pastikan tabel stock_usage sudah di-TRUNCATE dulu sebelum run ini,
// supaya tidak ada duplikat dari proses lama yang sempat jalan sebagian.

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const USAGE_FILE = path.join(__dirname, "report_usage.csv");
const BATCH_SIZE = 500;

async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password123",
    database: process.env.DB_NAME || "dental_db",
  });
}

function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", (err) => reject(err));
  });
}

function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === "") return null;
  const cleaned = dateStr.trim();
  const months = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };
  const parts = cleaned.split("-");
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    const year = parseInt(parts[2]);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      const d = new Date(year, month, day);
      return d.toISOString().split("T")[0];
    }
  }
  const d = new Date(cleaned);
  if (!isNaN(d)) return d.toISOString().split("T")[0];
  return null;
}

async function insertBatch(db, batch) {
  if (batch.length === 0) return;
  const placeholders = batch.map(() => "(?,?,?,?,?,?,?,?,?,?,?)").join(",");
  const values = batch.flat();
  await db.execute(
    `INSERT INTO stock_usage
      (material_id, user_id, sub_uniq_id, patient_name,
       doctor_name, qty_of_usage, qty_of_return,
       item_received, notes, month_of_usage, usage_date)
     VALUES ${placeholders}`,
    values
  );
}

async function main() {
  console.log("🚀 Mulai import Report Usage (versi cepat)...\n");
  const db = await getConnection();
  console.log("✅  Terhubung ke MySQL:", process.env.DB_NAME);

  if (!fs.existsSync(USAGE_FILE)) {
    console.log("⚠️  File report_usage.csv tidak ditemukan.");
    await db.end();
    return;
  }

  // 1. Preload semua kode_barang -> id ke memori (1 query saja)
  console.log("📦 Preload data materials ke memori...");
  const [materialRows] = await db.execute(
    "SELECT id, kode_barang FROM materials"
  );
  const materialMap = new Map();
  for (const m of materialRows) materialMap.set(m.kode_barang, m.id);
  console.log(`   → ${materialMap.size} kode_barang dimuat ke memori\n`);

  // 2. Ambil default user (teknisi) - 1 query saja
  const [userRows] = await db.execute(
    "SELECT id FROM users WHERE role_id = 2 LIMIT 1"
  );
  const userId = userRows.length > 0 ? userRows[0].id : 1;

  // 3. Baca semua baris CSV
  console.log("📋 Membaca report_usage.csv...");
  const rows = await readCSV(USAGE_FILE);
  console.log(`   → ${rows.length} baris ditemukan\n`);

  let success = 0,
    skipped = 0,
    batch = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const itemCode = (row["Item Code"] || "").trim();
    const usageDateRaw = (row["Date of Usage"] || "").trim();
    const patientName = (row["Patient Name"] || "").trim();
    const doctorName = (row["Doctor Name"] || "").trim();
    const subUniqId = (row["Sub Uniq Id"] || "").trim();
    const qtyUsage = parseFloat(row["Qty of Usage"] || 1) || 1;
    const qtyReturn = parseFloat(row["Qty of Return"] || 0) || 0;
    const itemReceived =
      (row["Item Received?"] || "").trim().toUpperCase() === "TRUE" ? 1 : 0;
    const notes = (row["Notes"] || "").trim();
    const monthUsage = (row["Month of Usage"] || "").trim();

    if (!itemCode || itemCode === "Item Code") {
      skipped++;
      continue;
    }

    const usageDate = parseDate(usageDateRaw);
    if (!usageDate) {
      skipped++;
      continue;
    }

    // Lookup dari Map di memori, bukan query ke database
    const materialId = materialMap.get(itemCode);
    if (!materialId) {
      skipped++;
      continue;
    }

    batch.push([
      materialId,
      userId,
      subUniqId,
      patientName,
      doctorName,
      qtyUsage,
      qtyReturn,
      itemReceived,
      notes,
      monthUsage,
      usageDate,
    ]);
    success++;

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(db, batch);
      console.log(
        `  ✅  Progress: ${i + 1}/${
          rows.length
        } baris diproses (${success} berhasil, ${skipped} dilewati)`
      );
      batch = [];
    }
  }

  // Sisa batch terakhir yang belum genap 500
  if (batch.length > 0) {
    await insertBatch(db, batch);
  }

  console.log(
    `\n🎉  Import selesai! Berhasil: ${success} records | Dilewati: ${skipped}\n`
  );
  await db.end();
}

main().catch((err) => {
  console.error("\n❌  Error:", err.message);
  process.exit(1);
});
