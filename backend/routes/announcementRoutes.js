const express = require("express");
const router = express.Router();

const announcementController = require("../controllers/announcementController");
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post(
  "/create",
  verifyToken,
  upload.single("file"),
  announcementController.createAnnouncement
);

router.get(
  "/class/:id",
  verifyToken,
  announcementController.getAnnouncementsByClass
);

router.get(
  "/subject/:id",
  verifyToken,
  announcementController.getAnnouncementsBySubject
);

router.get(
  "/student",
  verifyToken,
  announcementController.getAnnouncementsForStudent
);

router.delete(
  "/delete/:id",
  verifyToken,
  announcementController.deleteAnnouncement
);

module.exports = router;
