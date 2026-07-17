// backend/src/controllers/stockController.js
const pool = require("../config/database");
const { checkLowStockAndNotify } = require("../services/notificationService");

exports.getSummary = async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT m.id, m.kode_barang, m.nama_barang, m.unit,
             m.current_stock, m.min_stock, m.price_per_unit,
             b.name AS brand_name, mc.name AS category_name,
             CASE
               WHEN m.current_stock = 0            THEN 'OUT'
               WHEN m.current_stock <= m.min_stock  THEN 'LOW'
               ELSE 'OK'
             END AS stock_status
      FROM materials m
      LEFT JOIN brands b             ON m.brand_id    = b.id
      LEFT JOIN material_categories mc ON m.category_id = mc.id
      WHERE m.is_active = 1
      ORDER BY stock_status ASC, m.kode_barang ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const { material_id, type, from, to } = req.query;
    let sql = `
      SELECT st.*, m.nama_barang, m.kode_barang, m.unit,
             u.full_name AS user_name
      FROM stock_transactions st
      JOIN materials m ON st.material_id = m.id
      JOIN users u     ON st.user_id     = u.id
      WHERE 1=1
    `;
    const params = [];

    if (material_id) {
      sql += " AND st.material_id = ?";
      params.push(material_id);
    }
    if (type) {
      sql += " AND st.transaction_type = ?";
      params.push(type);
    }
    if (from) {
      sql += " AND DATE(st.transaction_date) >= ?";
      params.push(from);
    }
    if (to) {
      sql += " AND DATE(st.transaction_date) <= ?";
      params.push(to);
    }

    sql += " ORDER BY st.transaction_date DESC LIMIT 100";

    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.stockIn = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { material_id, quantity, price_per_unit, batch_number, note } =
      req.body;
    const qty = parseFloat(quantity);

    if (!material_id || qty <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Material dan jumlah wajib diisi" });

    const [mats] = await conn.execute(
      "SELECT id, nama_barang FROM materials WHERE id=? AND is_active=1",
      [material_id]
    );
    if (!mats.length)
      return res
        .status(404)
        .json({ success: false, message: "Material tidak ditemukan" });

    await conn.execute(
      `INSERT INTO stock_transactions
        (material_id, user_id, transaction_type, quantity, price_per_unit, batch_number, note)
       VALUES (?,?,'IN',?,?,?,?)`,
      [
        material_id,
        req.user.id,
        qty,
        price_per_unit || 0,
        batch_number || null,
        note || null,
      ]
    );

    await conn.execute(
      "UPDATE materials SET current_stock = current_stock + ? WHERE id = ?",
      [qty, material_id]
    );

    await conn.commit();
    res
      .status(201)
      .json({ success: true, message: `Stok masuk ${qty} berhasil dicatat` });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// Generate nomor dokumen: SST-YYYYMMDD-0001
async function generateDocNumber(conn, docDate) {
  const ymd = docDate.replace(/-/g, "");
  const [rows] = await conn.execute(
    "SELECT COUNT(*) AS cnt FROM handover_documents WHERE doc_number LIKE ?",
    [`SST-${ymd}-%`]
  );
  const seq = String((rows[0].cnt || 0) + 1).padStart(4, "0");
  return `SST-${ymd}-${seq}`;
}

// POST /api/stocks/out-from-usage
// Admin memproses Stok Keluar berdasarkan Riwayat Pemakaian yang sudah diverifikasi,
// lalu langsung membuat Surat Serah Terima (handover document) dari transaksi tsb.
exports.stockOutFromUsage = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { usage_ids, to_location, received_by_name, notes, doc_date } =
      req.body;

    if (!Array.isArray(usage_ids) || usage_ids.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "Pilih minimal satu data pemakaian" });

    const placeholders = usage_ids.map(() => "?").join(",");
    const [usages] = await conn.execute(
      `SELECT su.*, m.nama_barang, m.current_stock
       FROM stock_usage su
       JOIN materials m ON su.material_id = m.id
       WHERE su.id IN (${placeholders})
         AND su.verification_status = 'VERIFIED'
         AND su.stock_out_tx_id IS NULL
       FOR UPDATE`,
      usage_ids
    );

    if (!usages.length) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Tidak ada data pemakaian valid (harus berstatus VERIFIED dan belum diproses)",
      });
    }

    // Validasi stok cukup untuk semua item lebih dulu
    for (const u of usages) {
      const netQty =
        parseFloat(u.qty_of_usage) - parseFloat(u.qty_of_return || 0);
      if (netQty > 0 && parseFloat(u.current_stock) < netQty) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Stok ${u.nama_barang} tidak mencukupi. Tersedia: ${u.current_stock}`,
        });
      }
    }

    const finalDocDate = doc_date || new Date().toISOString().slice(0, 10);
    const docNumber = await generateDocNumber(conn, finalDocDate);

    const [docResult] = await conn.execute(
      `INSERT INTO handover_documents
        (doc_number, doc_date, from_location, to_location, created_by, received_by_name, notes)
       VALUES (?,?,?,?,?,?,?)`,
      [
        docNumber,
        finalDocDate,
        "Gudang Dental Lab",
        to_location || "Klinik",
        req.user.id,
        received_by_name || null,
        notes || null,
      ]
    );
    const handoverId = docResult.insertId;

    for (const u of usages) {
      const netQty =
        parseFloat(u.qty_of_usage) - parseFloat(u.qty_of_return || 0);

      const [txResult] = await conn.execute(
        `INSERT INTO stock_transactions
          (material_id, usage_id, handover_id, user_id, transaction_type, quantity, note)
         VALUES (?,?,?,?,'OUT',?,?)`,
        [
          u.material_id,
          u.id,
          handoverId,
          req.user.id,
          netQty,
          `Stok keluar dari pemakaian pasien: ${u.patient_name || "-"}`,
        ]
      );

      if (netQty > 0) {
        await conn.execute(
          "UPDATE materials SET current_stock = current_stock - ? WHERE id = ?",
          [netQty, u.material_id]
        );
      }

      await conn.execute(
        "UPDATE stock_usage SET stock_out_tx_id = ? WHERE id = ?",
        [txResult.insertId, u.id]
      );
    }

    await conn.commit();

    // Cek notifikasi stok minimum untuk tiap material yang terdampak (tidak block response)
    const uniqueMaterialIds = [...new Set(usages.map((u) => u.material_id))];
    uniqueMaterialIds.forEach((id) =>
      checkLowStockAndNotify(id).catch(console.error)
    );

    res.status(201).json({
      success: true,
      message: `Stok keluar berhasil dicatat untuk ${usages.length} item`,
      data: { handover_id: handoverId, doc_number: docNumber },
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// GET /api/stocks/handover  (daftar surat serah terima)
exports.getHandoverList = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    let sql = `
      SELECT hd.*, u.full_name AS created_by_name,
             COUNT(st.id) AS total_item,
             SUM(st.quantity) AS total_qty
      FROM handover_documents hd
      JOIN users u ON hd.created_by = u.id
      LEFT JOIN stock_transactions st ON st.handover_id = hd.id
      WHERE 1=1
    `;
    const params = [];
    if (from) {
      sql += " AND hd.doc_date >= ?";
      params.push(from);
    }
    if (to) {
      sql += " AND hd.doc_date <= ?";
      params.push(to);
    }
    sql += " GROUP BY hd.id ORDER BY hd.created_at DESC LIMIT 200";

    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/stocks/handover/:id  (detail untuk dicetak)
exports.getHandoverDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [docs] = await pool.execute(
      `SELECT hd.*, u.full_name AS created_by_name
       FROM handover_documents hd
       JOIN users u ON hd.created_by = u.id
       WHERE hd.id = ?`,
      [id]
    );
    if (!docs.length)
      return res
        .status(404)
        .json({
          success: false,
          message: "Surat serah terima tidak ditemukan",
        });

    const [items] = await pool.execute(
      `SELECT st.id AS transaction_id, st.quantity, st.transaction_date,
              m.kode_barang, m.nama_barang, m.unit,
              su.patient_name, su.doctor_name, su.usage_date
       FROM stock_transactions st
       JOIN materials m ON st.material_id = m.id
       LEFT JOIN stock_usage su ON st.usage_id = su.id
       WHERE st.handover_id = ?
       ORDER BY st.id ASC`,
      [id]
    );

    res.json({ success: true, data: { ...docs[0], items } });
  } catch (err) {
    next(err);
  }
};

exports.stockOut = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { material_id, quantity, note } = req.body;
    const qty = parseFloat(quantity);

    if (!material_id || qty <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Material dan jumlah wajib diisi" });

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

    await conn.execute(
      `INSERT INTO stock_transactions
        (material_id, user_id, transaction_type, quantity, note)
       VALUES (?,?,'OUT',?,?)`,
      [material_id, req.user.id, qty, note || null]
    );

    await conn.execute(
      "UPDATE materials SET current_stock = current_stock - ? WHERE id = ?",
      [qty, material_id]
    );

    await conn.commit();

    // Cek notifikasi stok minimum (tidak block response)
    checkLowStockAndNotify(material_id).catch(console.error);

    res
      .status(201)
      .json({ success: true, message: `Stok keluar ${qty} berhasil dicatat` });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};
