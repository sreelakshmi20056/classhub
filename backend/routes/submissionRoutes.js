const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { isTeacher } = require("../middleware/teacherMiddleware");
const upload = require("../middleware/upload");
const submissionController = require("../controllers/submissionController");

router.post(
  "/submit",
  verifyToken,
  upload.single("file"),
  submissionController.submitAssignment
);

router.post(
  "/",
  verifyToken,
  upload.single("file"),
  submissionController.submitAssignment
);

// Specific routes before parameterized routes
router.get(
  "/student",
  verifyToken,
  submissionController.getStudentSubmissions
);

router.get(
  "/assignment/:id",
  verifyToken,
  submissionController.getSubmissionsForAssignment
);

module.exports = router;