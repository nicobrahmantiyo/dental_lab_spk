// backend/src/controllers/notificationController.js
const pool = require("../config/database");

exports.getMyNotifications = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM notifications
       WHERE (user_id = ? OR role_target = ?)
       ORDER BY created_at DESC LIMIT 30`,
      [req.user.id, req.user.role]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const [[{ count }]] = await pool.execute(
      `SELECT COUNT(*) AS count FROM notifications
       WHERE (user_id=? OR role_target=?) AND is_read=0`,
      [req.user.id, req.user.role]
    );
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    await pool.execute(
      "UPDATE notifications SET is_read=1 WHERE id=? AND (user_id=? OR role_target=?)",
      [req.params.id, req.user.id, req.user.role]
    );
    res.json({ success: true, message: "Notifikasi dibaca" });
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await pool.execute(
      "UPDATE notifications SET is_read=1 WHERE (user_id=? OR role_target=?) AND is_read=0",
      [req.user.id, req.user.role]
    );
    res.json({ success: true, message: "Semua notifikasi dibaca" });
  } catch (err) {
    next(err);
  }
};
