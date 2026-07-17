// backend/src/routes/material.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/materialController');
const auth   = require('../middlewares/auth');
const role   = require('../middlewares/role');

router.get('/categories',  auth, ctrl.getCategories);
router.get('/brands',      auth, ctrl.getBrands);
router.get('/stats',       auth, ctrl.getStats);
router.get('/',            auth, ctrl.getAll);
router.get('/:id',         auth, ctrl.getById);
router.post('/',           auth, role('admin'), ctrl.create);
router.put('/:id',         auth, role('admin'), ctrl.update);
router.delete('/:id',      auth, role('admin'), ctrl.remove);

module.exports = router;