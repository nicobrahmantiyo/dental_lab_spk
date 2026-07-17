// backend/src/controllers/userController.js
const bcrypt = require("bcryptjs");
const pool = require("../config/database");

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.full_name, u.email,
              u.is_active, u.last_login, u.created_at,
              r.name AS role, r.label AS role_label
       FROM users u JOIN roles r ON u.role_id = r.id
       ORDER BY u.id`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { role_id, username, full_name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.execute(
      `INSERT INTO users (role_id, username, full_name, email, password)
       VALUES (?,?,?,?,?)`,
      [role_id, username, full_name, email, hash]
    );
    res
      .status(201)
      .json({ success: true, message: "User berhasil dibuat", id: r.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res
        .status(409)
        .json({
          success: false,
          message: "Username atau email sudah digunakan",
        });
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { role_id, full_name, email, is_active } = req.body;
    await pool.execute(
      `UPDATE users SET role_id=?, full_name=?, email=?, is_active=? WHERE id=?`,
      [role_id, full_name, email, is_active, req.params.id]
    );
    res.json({ success: true, message: "User berhasil diupdate" });
  } catch (err) {
    next(err);
  }
};

exports.deactivate = async (req, res, next) => {
  try {
    await pool.execute("UPDATE users SET is_active = 0 WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "User dinonaktifkan" });
  } catch (err) {
    next(err);
  }
};
