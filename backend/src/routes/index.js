// backend/src/routes/index.js
const router = require('express').Router();

router.use('/auth',          require('./auth.routes'));
router.use('/materials',     require('./material.routes'));
router.use('/stocks',        require('./stock.routes'));
router.use('/usage',         require('./usage.routes'));
router.use('/topsis',        require('./topsis.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/users',         require('./user.routes'))
router.use('/vendors',       require('./vendor.routes'))
router.use('/vendor-prices', require('./vendorPrice.routes'))
router.use('/purchase-requests', require('./purchaseRequest.routes'))

module.exports = router;