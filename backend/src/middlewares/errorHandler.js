// backend/src/middlewares/errorHandler.js
module.exports = (err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};