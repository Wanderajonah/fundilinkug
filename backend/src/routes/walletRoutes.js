const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getWallet,
  getTransactions,
  deposit,
  withdraw,
  payBooking,
  transfer,
  holdPayment,
  releasePayment,
  refundPayment,
} = require("../controllers/walletController");

router.get("/", protect, getWallet);
router.get("/transactions", protect, getTransactions);
router.post("/deposit", protect, deposit);
router.post("/withdraw", protect, withdraw);
router.post("/pay", protect, payBooking);
router.post("/transfer", protect, transfer);
router.post("/hold", protect, holdPayment);
router.post("/release", protect, releasePayment);
router.post("/refund", protect, refundPayment);

module.exports = router;
