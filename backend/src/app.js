// backend/src/app.js
const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');
require('dotenv').config();

const routes       = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use('/api', routes);

app.get('/health', (_req, res) =>
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
);

app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' })
);

app.use(errorHandler);

module.exports = app;