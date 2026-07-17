// backend/src/routes/topsis.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/topsisController');
const auth   = require('../middlewares/auth');
const role   = require('../middlewares/role');

router.get('/criteria',        auth, ctrl.getCriteria);
router.put('/criteria/:id',    auth, role('admin','manager'), ctrl.updateCriteria);
router.post('/analyze',        auth, role('admin','manager'), ctrl.analyze);
router.get('/history',         auth, role('admin','manager'), ctrl.getHistory);
router.get('/history/:id',     auth, role('admin','manager'), ctrl.getHistoryDetail);

module.exports = router;