const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const BEGINNING_STOCK_FILE = path.join(__dirname, "beginning_stock.csv");
const USAGE_FILE = path.join(__dirname, "report_usage.csv");

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

async function importBeginningStock(db) {
  console.log("\n📦 Mengimport data Beginning Stock...");
  const rows = await readCSV(BEGINNING_STOCK_FILE);
  let success = 0,
    skipped = 0;

  for (const row of rows) {
    const kodeBrg = (row["Kode Barang"] || "").trim();
    const namaBrg = (row["Nama Barang"] || "").trim();
    if (!kodeBrg || !namaBrg || kodeBrg === "Kode Barang") {
      skipped++;
      continue;
    }

    const brandName = (row["Brand"] || "Lainnya").trim();
    const beginningStk = parseFloat(row["Beginning Stock"] || 0) || 0;
    const currentStk = parseFloat(row["Current Stock"] || 0) || 0;

    try {
      const [brandRows] = await db.execute(
        "SELECT id FROM brands WHERE name = ?",
        [brandName]
      );
      let brandId;
      if (brandRows.length > 0) {
        brandId = brandRows[0].id;
      } else {
        const [res] = await db.execute("INSERT INTO brands (name) VALUES (?)", [
          brandName,
        ]);
        brandId = res.insertId;
      }

      let categoryId = 7;
      const namaLower = namaBrg.toLowerCase();
      if (
        namaLower.includes("disc zircone") ||
        namaLower.includes("disc titanium")
      )
        categoryId = 3;
      else if (namaLower.includes("ceramic glass")) categoryId = 4;
      else if (namaLower.includes("abutment")) categoryId = 1;
      else if (namaLower.includes("analog")) categoryId = 2;
      else if (namaLower.includes("implant")) categoryId = 5;
      else if (namaLower.includes("bur")) categoryId = 6;

      await db.execute(
        `
        INSERT INTO materials
          (category_id, brand_id, kode_barang, nama_barang, unit,
           beginning_stock, current_stock, min_stock)
        VALUES (?, ?, ?, ?, 'pcs', ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          nama_barang     = VALUES(nama_barang),
          brand_id        = VALUES(brand_id),
          category_id     = VALUES(category_id),
          beginning_stock = VALUES(beginning_stock),
          current_stock   = VALUES(current_stock)
      `,
        [categoryId, brandId, kodeBrg, namaBrg, beginningStk, currentStk]
      );

      success++;
      console.log(`  ✅  ${kodeBrg} — ${namaBrg}`);
    } catch (err) {
      console.log(`  ⚠️  Skip ${kodeBrg}: ${err.message}`);
      skipped++;
    }
  }
  console.log(`\n  📊 Berhasil: ${success} | Dilewati: ${skipped}`);
}

async function importReportUsage(db) {
  console.log("\n📋 Mengimport data Report Usage Tanam...");
  if (!fs.existsSync(USAGE_FILE)) {
    console.log("  ⚠️  File tidak ditemukan, dilewati.");
    return;
  }

  const rows = await readCSV(USAGE_FILE);

  const [userRows] = await db.execute(
    "SELECT id FROM users WHERE role_id = 2 LIMIT 1"
  );
  const userId = userRows.length > 0 ? userRows[0].id : 1;

  let success = 0,
    skipped = 0;

  for (const row of rows) {
    // Kolom yang dipakai (kolom lain diabaikan)
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

    // Skip baris kosong
    if (!itemCode || itemCode === "Item Code") {
      skipped++;
      continue;
    }

    // Parse tanggal
    const usageDate = parseDate(usageDateRaw);
    if (!usageDate) {
      skipped++;
      continue;
    }

    // Cari material
    const [matRows] = await db.execute(
      "SELECT id FROM materials WHERE kode_barang = ?",
      [itemCode]
    );
    if (!matRows.length) {
      skipped++;
      continue;
    }

    try {
      await db.execute(
        `
        INSERT INTO stock_usage
          (material_id, user_id, sub_uniq_id, patient_name,
           doctor_name, qty_of_usage, qty_of_return,
           item_received, notes, month_of_usage, usage_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          matRows[0].id,
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
        ]
      );
      success++;
    } catch (err) {
      skipped++;
    }
  }
  console.log(`\n  📊 Berhasil: ${success} records | Dilewati: ${skipped}`);
}

async function main() {
  console.log("🚀 Mulai import data dari CSV...\n");
  const db = await getConnection();
  console.log("✅  Terhubung ke MySQL:", process.env.DB_NAME);
  try {
    await importBeginningStock(db);
    await importReportUsage(db);
    console.log("\n🎉  Import selesai!\n");
  } catch (err) {
    console.error("\n❌  Error:", err.message);
  } finally {
    await db.end();
  }
}

main();
