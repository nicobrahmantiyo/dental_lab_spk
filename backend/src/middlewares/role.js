// backend/src/middlewares/role.js
module.exports = (...allowed) => (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: 'Tidak terautentikasi' });

  if (!allowed.includes(req.user.role))
    return res.status(403).json({
      success: false,
      message: `Role "${req.user.role}" tidak memiliki akses`,
    });

  next();
};