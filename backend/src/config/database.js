const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "dental_db",
  waitForConnections: true,
  connectionLimit: 10,
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
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  testConnection();
}

module.exports = pool;
