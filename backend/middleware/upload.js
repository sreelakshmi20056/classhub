const fs = require("fs");
const path = require("path");
const multer = require("multer");

const configuredUploadsDir = String(process.env.UPLOADS_DIR || "").trim();
const uploadsDir = configuredUploadsDir || path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

module.exports = upload;