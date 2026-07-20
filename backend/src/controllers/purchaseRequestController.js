// backend/src/controllers/purchaseRequestController.js
const pool = require("../config/database");
const { createNotification } = require("../services/notificationService");

function genRequestNo() {
  const d = new Date();
  return `PUR-${d.getFullYear()}${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(d.getDate()).padStart(2, "0")}-${Date.now().toString().slice(-4)}`;
}

// GET /api/purchase-requests
exports.getAll = async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT pr.*,
             u1.full_name AS requester_name,
             u2.full_name AS approver_name,
             m.nama_barang, m.kode_barang, m.unit,
             m.current_stock, m.min_stock
      FROM purchase_requests pr
      JOIN users u1    ON pr.requested_by = u1.id
      LEFT JOIN users u2 ON pr.approved_by  = u2.id
      JOIN materials m ON pr.material_id   = m.id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      sql += " AND pr.status=?";
      params.push(status);
    }
    sql += " ORDER BY pr.requested_at DESC";

    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/purchase-requests
// Admin Inventori buat pengajuan pembelian
exports.create = async (req, res, next) => {
  try {
    const { material_id, qty_requested, note } = req.body;

    if (!material_id || !qty_requested)
      return res.status(400).json({
        success: false,
        message: "Material dan jumlah wajib diisi",
      });

    // Cek material memang stok menipis/habis
    const [mats] = await pool.execute(
      "SELECT id, nama_barang, kode_barang, current_stock, min_stock FROM materials WHERE id=?",
      [material_id]
    );
    if (!mats.length)
      return res
        .status(404)
        .json({ success: false, message: "Material tidak ditemukan" });

    const mat = mats[0];
    if (parseFloat(mat.current_stock) > parseFloat(mat.min_stock))
      return res.status(400).json({
        success: false,
        message: `Stok ${mat.nama_barang} masih mencukupi (${mat.current_stock}). Pengajuan hanya untuk stok menipis/habis.`,
      });

    const requestNo = genRequestNo();
    const [r] = await pool.execute(
      `INSERT INTO purchase_requests
        (request_no, requested_by, material_id, qty_requested, note)
       VALUES (?,?,?,?,?)`,
      [requestNo, req.user.id, material_id, qty_requested, note || null]
    );

    // Notifikasi ke manager
    await createNotification({
      roleTarget: "manager",
      type: "REQUEST",
      title: `Pengajuan Pembelian Baru: ${mat.kode_barang}`,
      message: `${req.user.full_name} mengajukan pembelian ${
        mat.nama_barang
      } sebanyak ${qty_requested} ${mat.unit || "pcs"}. Stok saat ini: ${
        mat.current_stock
      }. No: ${requestNo}`,
      materialId: material_id,
    });

    res.status(201).json({
      success: true,
      message: "Pengajuan pembelian berhasil dibuat",
      request_no: requestNo,
      id: r.insertId,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/purchase-requests/:id/approve
// Manajer setujui pengajuan
exports.approve = async (req, res, next) => {
  try {
    const { note_approval, topsis_result_id } = req.body;
    const [r] = await pool.execute(
      `UPDATE purchase_requests SET
        status='APPROVED', approved_by=?, note_approval=?,
        topsis_result_id=?, responded_at=NOW()
       WHERE id=? AND status='PENDING'`,
      [
        req.user.id,
        note_approval || null,
        topsis_result_id || null,
        req.params.id,
      ]
    );
    if (!r.affectedRows)
      return res.status(400).json({
        success: false,
        message: "Pengajuan tidak ditemukan atau sudah diproses",
      });

    // Notifikasi ke admin
    const [pr] = await pool.execute(
      "SELECT requested_by, request_no FROM purchase_requests WHERE id=?",
      [req.params.id]
    );
    if (pr.length) {
      await createNotification({
        userId: pr[0].requested_by,
        type: "INFO",
        title: "✅ Pengajuan Pembelian Disetujui",
        message: `Pengajuan ${pr[0].request_no} telah disetujui manajer. Silakan lakukan pembelian ke vendor yang direkomendasikan.`,
      });
    }

    res.json({ success: true, message: "Pengajuan disetujui" });
  } catch (err) {
    next(err);
  }
};

// PUT /api/purchase-requests/:id/reject
// Manajer tolak pengajuan
exports.reject = async (req, res, next) => {
  try {
    const { note_approval } = req.body;
    const [r] = await pool.execute(
      `UPDATE purchase_requests SET
        status='REJECTED', approved_by=?, note_approval=?, responded_at=NOW()
       WHERE id=? AND status='PENDING'`,
      [req.user.id, note_approval || null, req.params.id]
    );
    if (!r.affectedRows)
      return res.status(400).json({
        success: false,
        message: "Pengajuan tidak ditemukan atau sudah diproses",
      });

    const [pr] = await pool.execute(
      "SELECT requested_by, request_no FROM purchase_requests WHERE id=?",
      [req.params.id]
    );
    if (pr.length) {
      await createNotification({
        userId: pr[0].requested_by,
        type: "WARNING",
        title: "❌ Pengajuan Pembelian Ditolak",
        message: `Pengajuan ${pr[0].request_no} ditolak. Alasan: ${
          note_approval || "-"
        }`,
      });
    }

    res.json({ success: true, message: "Pengajuan ditolak" });
  } catch (err) {
    next(err);
  }
};
