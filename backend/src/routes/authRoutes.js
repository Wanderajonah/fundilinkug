const express = require("express");
const {
  register,
  sendOtp,
  verifyOtpRegister,
  verifyOtpLogin,
  googleAuth
} = require("../controllers/authController");


const router = express.Router();

router.post("/register", register);
router.post("/otp/send", sendOtp);
router.post("/otp/verify-register", verifyOtpRegister);
router.post("/otp/verify-login", verifyOtpLogin);

router.post("/google", googleAuth);

module.exports = router;

