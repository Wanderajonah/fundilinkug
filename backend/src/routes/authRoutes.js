const express = require("express");
const {
  register,
  sendOtp,
  verifyOtpRegister,
  verifyOtpLogin,
  selectRole,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");


const router = express.Router();

router.post("/register", register);
router.post("/otp/send", sendOtp);
router.post("/otp/verify-register", verifyOtpRegister);
router.post("/otp/verify-login", verifyOtpLogin);
router.post("/select-role", selectRole);

module.exports = router;

