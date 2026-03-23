const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const https = require("https");
const dns = require("dns").promises;
const {
  sendRegistrationOtpEmail,
  sendRegistrationSuccessEmail,
  sendPasswordResetEmail,
} = require("../utils/mailer");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_TTL_MS = 10 * 60 * 1000;
const registrationOtpStore = new Map();

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const isValidEmailFormat = (email) => EMAIL_REGEX.test(email);

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const hasOtpExpired = (record) => {
  if (!record || !record.expiresAt) {
    return true;
  }
  return record.expiresAt < Date.now();
};

const cleanupOtpRecord = (email) => {
  registrationOtpStore.delete(email);
};

const getValidOtpRecord = (email) => {
  const record = registrationOtpStore.get(email);
  if (!record) {
    return null;
  }

  if (hasOtpExpired(record)) {
    cleanupOtpRecord(email);
    return null;
  }

  return record;
};

const httpsGetJson = (url, headers = {}) => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let raw = "";
      res.on("data", (chunk) => {
        raw += chunk;
      });
      res.on("end", () => {
        try {
          const data = raw ? JSON.parse(raw) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
            return;
          }
          reject(new Error(data.error_description || data.error || "Google token validation failed"));
        } catch (parseError) {
          reject(parseError);
        }
      });
    });

    req.on("error", reject);
  });
};

const verifyMailboxExists = async (email) => {
  const apiKey = String(process.env.ABSTRACT_API_KEY || "").trim();
  if (!apiKey) {
    // Allow registration flow to continue when third-party validation is not configured.
    return { valid: true, serviceError: false };
  }

  try {
    const url =
      `https://emailreputation.abstractapi.com/v1/?api_key=${encodeURIComponent(apiKey)}` +
      `&email=${encodeURIComponent(email)}`;

    const result = await httpsGetJson(url);

    const deliverability = String(result?.email_deliverability?.status || "").toUpperCase();
    const mxFound = result?.email_deliverability?.is_mx_valid;
    const formatValid = result?.email_deliverability?.is_format_valid;
    const statusDetail = String(result?.email_deliverability?.status_detail || "").toLowerCase();

    // Accept broad provider types and only reject hard-invalid mailbox signals.
    const hasHardInvalidSignal =
      formatValid === false ||
      mxFound === false ||
      statusDetail === "invalid_mailbox" ||
      deliverability === "UNDELIVERABLE";

    const valid = !hasHardInvalidSignal;

    return { valid, serviceError: false };
  } catch (error) {
    console.error("Email verification API failed", error);
    // Fallback to DNS validation if provider API is temporarily unavailable.
    return { valid: true, serviceError: false };
  }
};
const hasValidMailDomain = async (email) => {
  const domain = String(email || "").split("@")[1];
  if (!domain) return false;

  try {
    const mxRecords = await dns.resolveMx(domain);
    if (Array.isArray(mxRecords) && mxRecords.length > 0) {
      return true;
    }
  } catch (error) {
    // If DNS is temporarily unavailable, do not block valid registrations.
    if (error && ["ENOTFOUND", "NXDOMAIN"].includes(error.code)) {
      return false;
    }
  }

  try {
    const aRecords = await dns.resolve4(domain);
    if (Array.isArray(aRecords) && aRecords.length > 0) {
      return true;
    }
  } catch (error) {
    if (error && ["ENOTFOUND", "NXDOMAIN"].includes(error.code)) {
      return false;
    }
  }

  try {
    const aaaaRecords = await dns.resolve6(domain);
    if (Array.isArray(aaaaRecords) && aaaaRecords.length > 0) {
      return true;
    }
  } catch (error) {
    if (error && ["ENOTFOUND", "NXDOMAIN"].includes(error.code)) {
      return false;
    }
  }

  // Unknown/temporary DNS failures should not reject registration.
  return true;
};

exports.register = async (req, res) => {
  const { name, email, password, role, otp } = req.body;

  const normalizedEmail = normalizeEmail(email);
  const normalizedOtp = String(otp || "").trim();

  if (!isValidEmailFormat(normalizedEmail)) {
    return res.status(400).json({ message: "Please enter valid email address" });
  }

  if (!normalizedOtp) {
    return res.status(400).json({ message: "Please enter OTP sent to your email" });
  }

  const otpRecord = getValidOtpRecord(normalizedEmail);
  if (!otpRecord) {
    return res.status(400).json({ message: "OTP expired or not found. Please request a new OTP." });
  }

  if (otpRecord.otp !== normalizedOtp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  const validMailDomain = await hasValidMailDomain(normalizedEmail);
  if (!validMailDomain) {
    return res.status(400).json({ message: "Please enter valid email address" });
  }

  const mailboxCheck = await verifyMailboxExists(normalizedEmail);
  if (mailboxCheck.serviceError) {
    return res.status(503).json({ message: "Email validation service is unavailable. Try again later." });
  }
  if (!mailboxCheck.valid) {
    return res.status(400).json({ message: "Please enter an existing valid email address" });
  }

  const hashed = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
    [name, normalizedEmail, hashed, role],
    async (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          cleanupOtpRecord(normalizedEmail);
          return res.status(400).json({ message: "Email already registered" });
        }
        return res.status(500).json(err);
      }

      cleanupOtpRecord(normalizedEmail);

      try {
        await sendRegistrationSuccessEmail(normalizedEmail, name);
      } catch (emailErr) {
        console.error("Failed to send registration success email", emailErr);
      }

      res.json({ message: "Registered successfully" });
    }
  );
};

exports.sendRegistrationOtp = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body?.email);

  if (!isValidEmailFormat(normalizedEmail)) {
    return res.status(400).json({ message: "Please enter valid email address" });
  }

  const validMailDomain = await hasValidMailDomain(normalizedEmail);
  if (!validMailDomain) {
    return res.status(400).json({ message: "Please enter valid email address" });
  }

  const mailboxCheck = await verifyMailboxExists(normalizedEmail);
  if (mailboxCheck.serviceError) {
    return res.status(503).json({ message: "Email validation service is unavailable. Try again later." });
  }
  if (!mailboxCheck.valid) {
    return res.status(400).json({ message: "Please enter an existing valid email address" });
  }

  db.query("SELECT id FROM users WHERE email=?", [normalizedEmail], async (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (Array.isArray(result) && result.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const otp = generateOtp();
    registrationOtpStore.set(normalizedEmail, {
      otp,
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    try {
      await sendRegistrationOtpEmail(normalizedEmail, otp);
      return res.json({ message: "OTP sent to your email" });
    } catch (emailErr) {
      cleanupOtpRecord(normalizedEmail);
      console.error("Failed to send registration OTP", emailErr);
      return res.status(500).json({ message: "Failed to send OTP email. Please try again." });
    }
  });
};

exports.login = (req, res) => {
  const normalizedEmail = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!isValidEmailFormat(normalizedEmail)) {
    return res.status(400).json({ message: "Please enter valid email address" });
  }

  db.query("SELECT * FROM users WHERE email=?", [normalizedEmail], async (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, role: user.role });
  });
};

exports.googleLogin = async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ message: "Google access token is required" });
  }

  try {
    const tokenInfo = await httpsGetJson(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
    );

    if (!tokenInfo?.email) {
      return res.status(401).json({ message: "Unable to verify Google account email" });
    }

    const emailVerified = tokenInfo.email_verified === "true" || tokenInfo.email_verified === true;
    if (!emailVerified) {
      return res.status(401).json({ message: "Google email is not verified" });
    }

    if (process.env.GOOGLE_CLIENT_ID && tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ message: "Invalid Google client" });
    }

    const normalizedGoogleEmail = normalizeEmail(tokenInfo.email);

    db.query("SELECT * FROM users WHERE email=?", [normalizedGoogleEmail], (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Database error", error: err });
      }

      if (!result || result.length === 0) {
        return res.status(404).json({ message: "No account found for this Google email. Please register first." });
      }

      const user = result[0];
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.json({ token, role: user.role });
    });
  } catch (error) {
    return res.status(401).json({ message: error.message || "Google authentication failed" });
  }
};

exports.googleConfig = (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || "" });
};

exports.forgotPassword = (req, res) => {
  const normalizedEmail = normalizeEmail(req.body?.email);

  if (!isValidEmailFormat(normalizedEmail)) {
    return res.status(400).json({ message: "Please enter valid email address" });
  }

  db.query(
    "SELECT id, name, email, password FROM users WHERE email=?",
    [normalizedEmail],
    async (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Database error", error: err });
      }

      // Prevent account enumeration by returning success even when email is unknown.
      if (!result || result.length === 0) {
        return res.json({ message: "If this email is registered, a password reset link has been sent." });
      }

      const user = result[0];
      const tokenSecret = `${process.env.JWT_SECRET}${user.password}`;
      const resetToken = jwt.sign(
        { id: user.id, purpose: "password_reset" },
        tokenSecret,
        { expiresIn: "15m" }
      );

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

      try {
        await sendPasswordResetEmail(user.email, user.name, resetLink);
      } catch (emailErr) {
        console.error("Failed to send password reset email", emailErr);
      }

      return res.json({ message: "If this email is registered, a password reset link has been sent." });
    }
  );
};

exports.resetPassword = (req, res) => {
  const token = String(req.body?.token || "").trim();
  const newPassword = String(req.body?.newPassword || "");

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const decoded = jwt.decode(token);
  if (!decoded || !decoded.id || decoded.purpose !== "password_reset") {
    return res.status(400).json({ message: "Invalid or expired reset link" });
  }

  db.query("SELECT id, password FROM users WHERE id=?", [decoded.id], async (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (!result || result.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    const user = result[0];
    const tokenSecret = `${process.env.JWT_SECRET}${user.password}`;

    try {
      const verified = jwt.verify(token, tokenSecret);
      if (verified.purpose !== "password_reset") {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }
    } catch (verifyErr) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.query("UPDATE users SET password=? WHERE id=?", [hashedPassword, user.id], (updateErr) => {
      if (updateErr) {
        return res.status(500).json({ message: "Failed to update password", error: updateErr });
      }
      return res.json({ message: "Password reset successful" });
    });
  });
};