const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { isTeacher } = require("../middleware/teacherMiddleware");
const classController = require("../controllers/classController");
const subjectController = require("../controllers/subjectController");

router.post("/create", verifyToken, classController.createClass);
router.post("/join", verifyToken, classController.joinClass);
router.get("/created", verifyToken, classController.getCreatedClasses);
router.get("/joined", verifyToken, classController.getJoinedClasses);
router.get("/:classId/details", verifyToken, classController.getClassDetails);
router.get("/:classId/students", verifyToken, classController.getClassStudents);
router.delete("/:classId", verifyToken, classController.deleteClassByCoordinator);
router.delete("/:classId/exit", verifyToken, isTeacher, classController.exitClass);
router.delete("/:classId/exit-student", verifyToken, classController.exitClassStudent);

// Subject operations scoped to a class
router.post("/:classId/subjects", verifyToken, subjectController.createSubject);
router.get("/:classId/subjects", verifyToken, subjectController.getSubjectsByClass);

// simple helper that returns a fresh Google Meet URL (redirects to meet.google.com/new)
router.post("/:classId/meet", verifyToken, classController.createMeetLink);

module.exports = router;