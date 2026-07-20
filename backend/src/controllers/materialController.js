// backend/src/controllers/materialController.js
const pool = require("../config/database");

exports.getAll = async (req, res, next) => {
  try {
    const { search, category_id, brand_id, low_stock } = req.query;
    let sql = `
      SELECT m.*, mc.name AS category_name, b.name AS brand_name,
        CASE WHEN m.current_stock <= m.min_stock THEN 1 ELSE 0 END AS is_low_stock
      FROM materials m
      LEFT JOIN material_categories mc ON m.category_id = mc.id
      LEFT JOIN brands b ON m.brand_id = b.id
      WHERE m.is_active = 1
    `;
    const params = [];

    if (search) {
      sql += " AND (m.nama_barang LIKE ? OR m.kode_barang LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category_id) {
      sql += " AND m.category_id = ?";
      params.push(category_id);
    }
    if (brand_id) {
      sql += " AND m.brand_id = ?";
      params.push(brand_id);
    }
    if (low_stock === "true") sql += " AND m.current_stock <= m.min_stock";

    sql += " ORDER BY m.kode_barang ASC";

    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.*, mc.name AS category_name, b.name AS brand_name
       FROM materials m
       LEFT JOIN material_categories mc ON m.category_id = mc.id
       LEFT JOIN brands b ON m.brand_id = b.id
       WHERE m.id = ? AND m.is_active = 1`,
      [req.params.id]
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Material tidak ditemukan" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      category_id,
      brand_id,
      kode_barang,
      nama_barang,
      unit,
      min_stock,
      price_per_unit,
    } = req.body;

    const [r] = await pool.execute(
      `INSERT INTO materials
        (category_id, brand_id, kode_barang, nama_barang, unit, min_stock, price_per_unit)
       VALUES (?,?,?,?,?,?,?)`,
      [
        category_id ?? null,
        brand_id ?? null,
        kode_barang,
        nama_barang,
        unit || "pcs",
        min_stock || 1,
        price_per_unit || 0,
      ]
    );
    res
      .status(201)
      .json({ success: true, message: "Material ditambahkan", id: r.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res
        .status(409)
        .json({ success: false, message: "Kode barang sudah ada" });
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const {
      category_id,
      brand_id,
      nama_barang,
      unit,
      min_stock,
      price_per_unit,
    } = req.body;
    const [r] = await pool.execute(
      `UPDATE materials SET category_id=?, brand_id=?, nama_barang=?,
        unit=?, min_stock=?, price_per_unit=? WHERE id=? AND is_active=1`,
      [
        category_id ?? null,
        brand_id ?? null,
        nama_barang,
        unit || "pcs",
        min_stock || 1,
        price_per_unit || 0,
        req.params.id,
      ]
    );
    if (!r.affectedRows)
      return res
        .status(404)
        .json({ success: false, message: "Material tidak ditemukan" });
    res.json({ success: true, message: "Material diupdate" });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await pool.execute("UPDATE materials SET is_active=0 WHERE id=?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Material dihapus" });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM material_categories ORDER BY name"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getBrands = async (_req, res, next) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM brands ORDER BY name");
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (_req, res, next) => {
  try {
    const [[{ total }]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM materials WHERE is_active=1"
    );
    const [[{ low_stock }]] = await pool.execute(
      "SELECT COUNT(*) AS low_stock FROM materials WHERE is_active=1 AND current_stock <= min_stock"
    );
    const [[{ out_stock }]] = await pool.execute(
      "SELECT COUNT(*) AS out_stock FROM materials WHERE is_active=1 AND current_stock = 0"
    );
    res.json({ success: true, data: { total, low_stock, out_stock } });
  } catch (err) {
    next(err);
  }
};
