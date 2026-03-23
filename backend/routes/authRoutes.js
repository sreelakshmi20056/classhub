const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");

router.post("/register/send-otp", auth.sendRegistrationOtp);
router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/google", auth.googleLogin);
router.get("/google-config", auth.googleConfig);
router.post("/forgot-password", auth.forgotPassword);
router.post("/reset-password", auth.resetPassword);

module.exports = router;