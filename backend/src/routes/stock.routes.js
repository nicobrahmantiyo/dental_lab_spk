// backend/src/routes/stock.routes.js
const router = require("express").Router();
const ctrl = require("../controllers/stockController");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

router.get("/summary", auth, ctrl.getSummary);
router.get("/transactions", auth, ctrl.getTransactions);
router.post("/in", auth, role("admin"), ctrl.stockIn);
router.post("/out", auth, role("admin"), ctrl.stockOut);
router.post("/out-from-usage", auth, role("admin"), ctrl.stockOutFromUsage);
router.get("/handover", auth, ctrl.getHandoverList);
router.get("/handover/:id", auth, ctrl.getHandoverDetail);

module.exports = router;
