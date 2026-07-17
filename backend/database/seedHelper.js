const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const USERS = [
  {
    username: "admin1",
    password: "Admin@123",
    roleId: 1,
    fullName: "Admin Inventori",
    email: "admin@dentallab.com",
  },
  {
    username: "teknisi1",
    password: "Tek@123",
    roleId: 2,
    fullName: "Teknisi Lab",
    email: "teknisi@dentallab.com",
  },
  {
    username: "manager1",
    password: "Man@123",
    roleId: 3,
    fullName: "Manager Lab",
    email: "manager@dentallab.com",
  },
];

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password123",
    database: process.env.DB_NAME || "dental_db",
  });

  console.log("✅  Terhubung ke MySQL\n");

  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    await db.execute(
      `INSERT INTO users (role_id, username, full_name, email, password)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      [u.roleId, u.username, u.fullName, u.email, hash]
    );
    console.log(`  👤  ${u.username.padEnd(12)} → password: ${u.password}`);
  }

  await db.end();
  console.log("\n🎉  User berhasil dibuat!");
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
