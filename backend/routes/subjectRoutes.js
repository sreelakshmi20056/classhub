const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const subjectController = require("../controllers/subjectController");

router.post("/create", verifyToken, subjectController.createSubject);
router.get("/:classId", verifyToken, subjectController.getSubjectsByClass);

module.exports = router;