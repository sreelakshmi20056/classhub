const express = require("express");
const router = express.Router();

const assignmentController = require("../controllers/assignmentController");
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post(
  "/create",
  verifyToken,
  upload.single("file"),
  assignmentController.createAssignment
);

router.get(
  "/class/:id",
  verifyToken,
  assignmentController.getAssignmentsByClass
);

router.get(
  "/subject/:id",
  verifyToken,
  assignmentController.getAssignmentsBySubject
);

router.get(
  "/student",
  verifyToken,
  assignmentController.getAssignmentsForStudent
);

router.delete(
  "/delete/:id",
  verifyToken,
  assignmentController.deleteAssignment
);

module.exports = router;