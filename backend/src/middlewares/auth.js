// backend/src/middlewares/auth.js
const jwt  = require('jsonwebtoken');
const pool = require('../config/database');

module.exports = async (req, res, next) => {
  const header = req.headers['authorization'];
  const token  = header && header.split(' ')[1];

  if (!token)
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.full_name, u.email, u.is_active,
              r.name AS role, r.label AS role_label
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [decoded.id]
    );

    if (!rows.length || !rows[0].is_active)
      return res.status(401).json({ success: false, message: 'Akun tidak aktif' });

    req.user = rows[0];
    next();
  } catch {
    return res.status(403).json({ success: false, message: 'Token tidak valid atau kedaluwarsa' });
  }
};