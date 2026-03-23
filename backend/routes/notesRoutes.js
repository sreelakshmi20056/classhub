const express = require("express");
const router = express.Router();

const notesController = require("../controllers/notesController");
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post(
  "/create",
  verifyToken,
  upload.single("file"),
  notesController.createNote
);

router.get(
  "/class/:id",
  verifyToken,
  notesController.getNotesByClass
);

router.get(
  "/subject/:id",
  verifyToken,
  notesController.getNotesBySubject
);

router.get(
  "/student",
  verifyToken,
  notesController.getNotesForStudent
);

module.exports = router;