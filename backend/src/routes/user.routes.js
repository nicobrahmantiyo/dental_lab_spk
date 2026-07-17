// backend/src/routes/user.routes.js
const router = require('express').Router()
const ctrl   = require('../controllers/userController')
const auth   = require('../middlewares/auth')
const role   = require('../middlewares/role')

router.get('/',       auth, role('admin'), ctrl.getAll)
router.post('/',      auth, role('admin'), ctrl.create)
router.put('/:id',    auth, role('admin'), ctrl.update)
router.delete('/:id', auth, role('admin'), ctrl.deactivate)

module.exports = router