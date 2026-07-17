// backend/src/routes/vendor.routes.js
const router = require('express').Router()
const ctrl   = require('../controllers/vendorController')
const auth   = require('../middlewares/auth')
const role   = require('../middlewares/role')

router.get('/',            auth, ctrl.getAll)
router.get('/:id',         auth, ctrl.getById)
router.get('/:id/prices',  auth, ctrl.getPrices)
router.post('/',           auth, role('manager'), ctrl.create)
router.put('/:id',         auth, role('manager'), ctrl.update)
router.delete('/:id',      auth, role('manager'), ctrl.remove)

module.exports = router