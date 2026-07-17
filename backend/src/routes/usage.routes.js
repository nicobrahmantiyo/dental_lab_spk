// backend/src/routes/usage.routes.js
const router = require("express").Router();
const ctrl = require("../controllers/usageController");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

router.get("/top-materials", auth, ctrl.getTopMaterials);
router.get("/monthly-trend", auth, ctrl.getMonthlyTrend);
router.get("/", auth, ctrl.getAll);
router.post("/", auth, role("admin", "technician"), ctrl.create);
router.patch("/:id/verify", auth, role("admin"), ctrl.verify);
router.delete("/:id", auth, role("admin"), ctrl.remove);

module.exports = router;
