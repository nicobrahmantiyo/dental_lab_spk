// backend/src/routes/vendorPrice.routes.js
const router = require('express').Router()
const ctrl   = require('../controllers/vendorPriceController')
const auth   = require('../middlewares/auth')
const role   = require('../middlewares/role')

router.get('/all',  auth, ctrl.getAll)
router.get('/',     auth, ctrl.getByMaterial)
router.post('/',    auth, role('manager'), ctrl.create)
router.put('/:id',  auth, role('manager'), ctrl.update)
router.delete('/:id', auth, role('manager'), ctrl.remove)

module.exports = router