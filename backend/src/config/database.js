const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "dental_db",
  waitForConnections: true,
  // PENTING: Clever Cloud plan DEV (Free) cuma izinkan maksimal 5 koneksi
  // bersamaan. Karena backend jalan sebagai Vercel Serverless Function,
  // bisa ada beberapa instance function aktif bersamaan — masing-masing
  // bikin pool sendiri. connectionLimit kecil (2) supaya total koneksi
  // dari semua instance tidak gampang menembus batas 5 itu.
  connectionLimit: 2,
  // Auto-tutup koneksi yang nganggur supaya tidak menumpuk di sisi
  // database ketika instance serverless idle/mati.
  maxIdle: 2,
  idleTimeout: 30000, // 30 detik
  queueLimit: 0,
  timezone: "+07:00",
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log("✅  MySQL terhubung:", process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error("❌  MySQL gagal terhubung:", err.message);
    // Di lingkungan serverless (Vercel), jangan matikan process —
    // biarkan error muncul natural saat query dijalankan.
    if (!process.env.VERCEL) process.exit(1);
  }
}

// Di Vercel, skip test koneksi saat cold start supaya tidak menambah
// jumlah koneksi yang dibuka setiap kali function "bangun". Error koneksi
// akan tetap muncul natural saat query pertama dijalankan.
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  testConnection();
}

module.exports = pool;
