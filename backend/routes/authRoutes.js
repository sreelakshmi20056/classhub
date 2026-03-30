const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/register/send-otp", auth.sendRegistrationOtp);
router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/google", auth.googleLogin);
router.get("/google-config", auth.googleConfig);
router.get("/me", verifyToken, auth.getProfile);
router.delete("/account", verifyToken, auth.deleteAccount);
router.post("/forgot-password", auth.forgotPassword);
router.post("/reset-password", auth.resetPassword);

module.exports = router;