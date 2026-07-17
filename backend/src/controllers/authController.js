// backend/src/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res
        .status(400)
        .json({ success: false, message: "Username dan password wajib diisi" });

    const [rows] = await pool.execute(
      `SELECT u.*, r.name AS role, r.label AS role_label
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.username = ? AND u.is_active = 1`,
      [username]
    );

    if (!rows.length || !(await bcrypt.compare(password, rows[0].password)))
      return res
        .status(401)
        .json({ success: false, message: "Username atau password salah" });

    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    await pool.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);

    res.json({
      success: true,
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        role_label: user.role_label,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = (req, res) => res.json({ success: true, user: req.user });

exports.changePassword = async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;
    const [rows] = await pool.execute(
      "SELECT password FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!(await bcrypt.compare(old_password, rows[0].password)))
      return res
        .status(400)
        .json({ success: false, message: "Password lama salah" });

    const hash = await bcrypt.hash(new_password, 10);
    await pool.execute("UPDATE users SET password = ? WHERE id = ?", [
      hash,
      req.user.id,
    ]);
    res.json({ success: true, message: "Password berhasil diubah" });
  } catch (err) {
    next(err);
  }
};
