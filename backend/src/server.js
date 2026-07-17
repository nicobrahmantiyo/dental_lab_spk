// backend/src/server.js
const app  = require('./app');
const port = process.env.PORT || 5001;

app.listen(port, () => {
  console.log(`🚀  Server berjalan → http://localhost:${port}`);
  console.log(`🌍  Environment    → ${process.env.NODE_ENV || 'development'}`);
});