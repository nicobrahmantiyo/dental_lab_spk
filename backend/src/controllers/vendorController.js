const pool = require("../config/database");

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM vendors WHERE is_active = 1 ORDER BY name`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM vendors WHERE id = ? AND is_active = 1",
      [req.params.id]
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Vendor tidak ditemukan" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, contact_person, phone, email, address, lead_time_days } =
      req.body;
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Nama vendor wajib diisi" });
    const [r] = await pool.execute(
      `INSERT INTO vendors (name, contact_person, phone, email, address, lead_time_days)
       VALUES (?,?,?,?,?,?)`,
      [
        name,
        contact_person || null,
        phone || null,
        email || null,
        address || null,
        lead_time_days || 0,
      ]
    );
    res
      .status(201)
      .json({
        success: true,
        message: "Vendor berhasil ditambahkan",
        id: r.insertId,
      });
  } catch (err) {
    next(err);
  }
};

// PUT /api/vendors/:id
exports.update = async (req, res, next) => {
  try {
    const { name, contact_person, phone, email, address, lead_time_days } =
      req.body;
    const [r] = await pool.execute(
      `UPDATE vendors SET name=?, contact_person=?, phone=?, email=?,
       address=?, lead_time_days=? WHERE id=? AND is_active=1`,
      [
        name,
        contact_person || null,
        phone || null,
        email || null,
        address || null,
        lead_time_days || 0,
        req.params.id,
      ]
    );
    if (!r.affectedRows)
      return res
        .status(404)
        .json({ success: false, message: "Vendor tidak ditemukan" });
    res.json({ success: true, message: "Vendor berhasil diupdate" });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/vendors/:id (soft delete)
exports.remove = async (req, res, next) => {
  try {
    await pool.execute("UPDATE vendors SET is_active = 0 WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Vendor dihapus" });
  } catch (err) {
    next(err);
  }
};

// GET /api/vendors/:id/prices — daftar harga vendor untuk semua material
exports.getPrices = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT vp.*, m.nama_barang, m.kode_barang, m.unit
       FROM vendor_prices vp
       JOIN materials m ON vp.material_id = m.id
       WHERE vp.vendor_id = ? AND vp.is_active = 1
       ORDER BY m.kode_barang`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
