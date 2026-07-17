// backend/src/controllers/vendorPriceController.js
// Kolom vendor_prices sesuai Skripsi BAB 3.3:
//   price_per_unit   → C1 Harga (Rp)
//   flexural_strength→ C2 Kualitas (MPa)
//   lead_time_days   → C3 Lead Time (hari)
//   reputation_years → C4 Reputasi (tahun berdiri perusahaan/brand)
//   certifications   → Info tambahan (tidak dipakai TOPSIS)
const pool = require("../config/database");

// GET /api/vendor-prices?material_id=xxx
exports.getByMaterial = async (req, res, next) => {
  try {
    const { material_id } = req.query;
    if (!material_id)
      return res
        .status(400)
        .json({ success: false, message: "material_id wajib diisi" });

    const [rows] = await pool.execute(
      `SELECT vp.*, v.name AS vendor_name, v.lead_time_days AS vendor_lead_time,
              m.nama_barang, m.kode_barang, m.unit
       FROM vendor_prices vp
       JOIN vendors v   ON vp.vendor_id   = v.id
       JOIN materials m ON vp.material_id = m.id
       WHERE vp.material_id = ? AND vp.is_active = 1 AND v.is_active = 1
       ORDER BY vp.price_per_unit ASC`,
      [material_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/vendor-prices/all
exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT vp.*, v.name AS vendor_name, m.nama_barang,
              m.kode_barang, m.unit
       FROM vendor_prices vp
       JOIN vendors v   ON vp.vendor_id   = v.id
       JOIN materials m ON vp.material_id = m.id
       WHERE vp.is_active = 1
       ORDER BY m.kode_barang, v.name`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/vendor-prices
exports.create = async (req, res, next) => {
  try {
    const {
      vendor_id,
      material_id,
      price_per_unit,
      flexural_strength,
      lead_time_days,
      reputation_years,
      certifications,
    } = req.body;

    if (!vendor_id || !material_id || !price_per_unit)
      return res
        .status(400)
        .json({
          success: false,
          message: "Vendor, material, dan harga wajib diisi",
        });

    const [r] = await pool.execute(
      `INSERT INTO vendor_prices
        (vendor_id, material_id, price_per_unit, flexural_strength,
         lead_time_days, reputation_years, certifications)
       VALUES (?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         price_per_unit     = VALUES(price_per_unit),
         flexural_strength  = VALUES(flexural_strength),
         lead_time_days     = VALUES(lead_time_days),
         reputation_years   = VALUES(reputation_years),
         certifications     = VALUES(certifications),
         is_active          = 1`,
      [
        vendor_id,
        material_id,
        price_per_unit,
        flexural_strength || 0,
        lead_time_days || 0,
        reputation_years || 0,
        certifications || null,
      ]
    );
    res
      .status(201)
      .json({
        success: true,
        message: "Harga vendor berhasil disimpan",
        id: r.insertId,
      });
  } catch (err) {
    next(err);
  }
};

// PUT /api/vendor-prices/:id
exports.update = async (req, res, next) => {
  try {
    const {
      price_per_unit,
      flexural_strength,
      lead_time_days,
      reputation_years,
      certifications,
    } = req.body;

    const [r] = await pool.execute(
      `UPDATE vendor_prices SET
         price_per_unit    = ?,
         flexural_strength = ?,
         lead_time_days    = ?,
         reputation_years  = ?,
         certifications    = ?
       WHERE id = ? AND is_active = 1`,
      [
        price_per_unit,
        flexural_strength || 0,
        lead_time_days || 0,
        reputation_years || 0,
        certifications || null,
        req.params.id,
      ]
    );
    if (!r.affectedRows)
      return res
        .status(404)
        .json({ success: false, message: "Data tidak ditemukan" });
    res.json({ success: true, message: "Harga vendor berhasil diupdate" });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/vendor-prices/:id
exports.remove = async (req, res, next) => {
  try {
    await pool.execute("UPDATE vendor_prices SET is_active = 0 WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Data harga vendor dihapus" });
  } catch (err) {
    next(err);
  }
};
