// backend/src/routes/purchaseRequest.routes.js
const router = require('express').Router()
const ctrl   = require('../controllers/purchaseRequestController')
const auth   = require('../middlewares/auth')
const role   = require('../middlewares/role')

router.get('/',            auth, ctrl.getAll)
router.post('/',           auth, role('admin'), ctrl.create)
router.put('/:id/approve', auth, role('manager'), ctrl.approve)
router.put('/:id/reject',  auth, role('manager'), ctrl.reject)

module.exports = router