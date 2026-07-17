// backend/src/controllers/usageController.js
const pool = require("../config/database");

exports.getAll = async (req, res, next) => {
  try {
    const {
      material_id,
      doctor_name,
      from,
      to,
      month,
      usage_month,
      status,
      unprocessed_only,
    } = req.query;
    let sql = `
      SELECT su.*, m.nama_barang, m.kode_barang, m.unit, m.current_stock,
             u.full_name AS input_by,
             v.full_name AS verified_by_name
      FROM stock_usage su
      JOIN materials m       ON su.material_id = m.id
      JOIN users u           ON su.user_id     = u.id
      LEFT JOIN users v      ON su.verified_by = v.id
      WHERE 1=1
    `;
    const params = [];

    if (material_id) {
      sql += " AND su.material_id = ?";
      params.push(material_id);
    }
    if (doctor_name) {
      sql += " AND su.doctor_name LIKE ?";
      params.push(`%${doctor_name}%`);
    }
    if (from) {
      sql += " AND su.usage_date >= ?";
      params.push(from);
    }
    if (to) {
      sql += " AND su.usage_date <= ?";
      params.push(to);
    }
    // usage_month: format YYYY-MM, difilter berdasarkan usage_date (reliable, bukan teks manual)
    if (usage_month) {
      sql += " AND DATE_FORMAT(su.usage_date, '%Y-%m') = ?";
      params.push(usage_month);
    }
    // month: kompatibilitas lama, cocokkan teks bebas month_of_usage tanpa peduli besar/kecil huruf
    if (month) {
      sql += " AND LOWER(su.month_of_usage) LIKE LOWER(?)";
      params.push(`%${month}%`);
    }
    if (status) {
      sql += " AND su.verification_status = ?";
      params.push(status);
    }
    if (unprocessed_only === "true") {
      sql +=
        " AND su.verification_status = 'VERIFIED' AND su.stock_out_tx_id IS NULL";
    }

    sql += " ORDER BY su.usage_date DESC LIMIT 200";

    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      material_id,
      sub_uniq_id,
      patient_name,
      doctor_name,
      qty_of_usage,
      qty_of_return,
      item_received,
      notes,
      month_of_usage,
      usage_date,
    } = req.body;

    const qty = parseFloat(qty_of_usage);

    if (!material_id || !usage_date || qty <= 0)
      return res
        .status(400)
        .json({
          success: false,
          message: "Material, tanggal, dan jumlah wajib diisi",
        });

    // Cek stok cukup
    const [mats] = await conn.execute(
      "SELECT id, nama_barang, current_stock FROM materials WHERE id=? AND is_active=1",
      [material_id]
    );
    if (!mats.length)
      return res
        .status(404)
        .json({ success: false, message: "Material tidak ditemukan" });

    if (parseFloat(mats[0].current_stock) < qty)
      return res.status(400).json({
        success: false,
        message: `Stok tidak mencukupi. Saat ini: ${mats[0].current_stock}`,
      });

    // Insert usage — berstatus PENDING, stok BELUM dipotong.
    // Stok baru akan dipotong saat Admin Inventori memverifikasi & memproses Stok Keluar.
    await conn.execute(
      `INSERT INTO stock_usage
        (material_id, user_id, sub_uniq_id, patient_name, doctor_name,
         qty_of_usage, qty_of_return, item_received,
         verification_status, notes, month_of_usage, usage_date)
       VALUES (?,?,?,?,?,?,?,?,'PENDING',?,?,?)`,
      [
        material_id,
        req.user.id,
        sub_uniq_id || null,
        patient_name || null,
        doctor_name || null,
        qty,
        qty_of_return || 0,
        item_received || 0,
        notes || null,
        month_of_usage || null,
        usage_date,
      ]
    );

    await conn.commit();

    res
      .status(201)
      .json({
        success: true,
        message:
          "Pemakaian berhasil dicatat, menunggu verifikasi Admin Inventori",
      });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// PATCH /api/usage/:id/verify  { status: 'VERIFIED' | 'REJECTED', reject_reason? }
exports.verify = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reject_reason } = req.body;

    if (!["VERIFIED", "REJECTED"].includes(status))
      return res
        .status(400)
        .json({ success: false, message: "Status verifikasi tidak valid" });

    const [rows] = await pool.execute(
      "SELECT id, verification_status FROM stock_usage WHERE id=?",
      [id]
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Data pemakaian tidak ditemukan" });

    if (rows[0].verification_status !== "PENDING")
      return res
        .status(400)
        .json({
          success: false,
          message: "Data ini sudah diverifikasi sebelumnya",
        });

    await pool.execute(
      `UPDATE stock_usage
       SET verification_status=?, verified_by=?, verified_at=NOW(), reject_reason=?
       WHERE id=?`,
      [
        status,
        req.user.id,
        status === "REJECTED" ? reject_reason || null : null,
        id,
      ]
    );

    res.json({
      success: true,
      message:
        status === "VERIFIED" ? "Pemakaian diverifikasi" : "Pemakaian ditolak",
    });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT verification_status, stock_out_tx_id FROM stock_usage WHERE id=?",
      [req.params.id]
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Data pemakaian tidak ditemukan" });
    if (rows[0].stock_out_tx_id)
      return res
        .status(400)
        .json({
          success: false,
          message: "Tidak bisa hapus, data sudah diproses menjadi Stok Keluar",
        });

    await pool.execute("DELETE FROM stock_usage WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Data pemakaian dihapus" });
  } catch (err) {
    next(err);
  }
};

exports.getTopMaterials = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const [rows] = await pool.execute(`
      SELECT
        m.kode_barang,
        m.nama_barang,
        m.unit,
        SUM(su.qty_of_usage) AS total_usage,
        COUNT(su.id)          AS total_transaksi
      FROM stock_usage su
      JOIN materials m ON su.material_id = m.id
      GROUP BY m.id, m.kode_barang, m.nama_barang, m.unit
      ORDER BY total_usage DESC
    `);
    const limited = rows.slice(0, parseInt(limit));
    res.json({ success: true, data: limited });
  } catch (err) {
    next(err);
  }
};

// GET /api/usage/monthly-trend
// Tren pemakaian per bulan (12 bulan terakhir)
exports.getMonthlyTrend = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        DATE_FORMAT(usage_date, '%Y-%m')   AS month_key,
        DATE_FORMAT(usage_date, '%b %Y')   AS month_label,
        SUM(qty_of_usage)                  AS total_usage,
        SUM(qty_of_usage - qty_of_return)  AS net_usage,
        COUNT(DISTINCT material_id)        AS total_material,
        COUNT(id)                          AS total_transaksi
      FROM stock_usage
      WHERE usage_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY month_key, month_label
      ORDER BY month_key ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
