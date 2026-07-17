// backend/src/services/notificationService.js
const pool = require('../config/database');

async function createNotification({ userId=null, roleTarget=null, type, title, message, materialId=null }) {
  await pool.execute(
    `INSERT INTO notifications (user_id, role_target, type, title, message, material_id)
     VALUES (?,?,?,?,?,?)`,
    [userId, roleTarget, type, title, message, materialId]
  );
}

async function checkLowStockAndNotify(materialId) {
  const [rows] = await pool.execute(
    'SELECT id, nama_barang, kode_barang, current_stock, min_stock, unit FROM materials WHERE id=?',
    [materialId]
  );
  if (!rows.length) return;

  const m = rows[0];
  if (parseFloat(m.current_stock) <= parseFloat(m.min_stock)) {
    const title   = `⚠️ Stok Minimum: ${m.nama_barang}`;
    const message = `Stok ${m.nama_barang} (${m.kode_barang}) saat ini ${m.current_stock} ${m.unit}, ` +
                    `di bawah minimum ${m.min_stock} ${m.unit}. Segera lakukan pemesanan.`;

    await createNotification({ roleTarget:'admin',   type:'LOW_STOCK', title, message, materialId });
    await createNotification({ roleTarget:'manager', type:'LOW_STOCK', title, message, materialId });
  }
}

module.exports = { createNotification, checkLowStockAndNotify };