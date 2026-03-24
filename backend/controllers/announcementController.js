const db = require("../config/db");
const { notifyAudienceForClassContent } = require("../utils/classNotificationMailer");
const { persistUploadedFile } = require("../utils/fileStorage");

// Teacher or coordinator creates an announcement; can target students, teachers, or both
exports.createAnnouncement = async (req, res) => {
  console.log("Creating announcement - user role:", req.user?.role);
  const userRole = req.user?.role;
  
  if (userRole !== "teacher" && userRole !== "coordinator") {
    console.log("Rejecting announcement creation - role not allowed:", userRole);
    return res.status(403).json({ message: "Only teacher or coordinator allowed" });
  }

  const { title, content, subject_id, class_id, audience } = req.body;
  const target = audience || "both"; // default
  let file = null;

  if (req.file) {
    try {
      file = await persistUploadedFile(req.file, "announcements");
    } catch (storageError) {
      console.error("Announcement file upload error:", storageError);
      return res.status(500).json({ message: "Error storing announcement file", error: storageError.message });
    }
  }

  // only coordinators may post class-wide announcements (no subject_id)
  if (req.user.role === "teacher" && (subject_id === null || subject_id === undefined)) {
    console.log("Teacher prevented from posting class-wide announcement");
    return res.status(403).json({ message: "Only coordinator can post class announcements" });
  }

  db.query(
    "INSERT INTO announcements (title,content,subject_id,class_id,audience,file) VALUES (?,?,?,?,?,?)",
    [title, content, subject_id, class_id, target, file],
    (err, result) => {
      if (err) {
        console.error("Announcement creation error:", err);
        return res.status(500).json({ message: "Error creating announcement", error: err });
      }

      const shouldNotifyAudience = req.user.role === "teacher" || req.user.role === "coordinator";
      if (shouldNotifyAudience) {
        notifyAudienceForClassContent({
          classId: class_id,
          subjectId: subject_id,
          type: "announcement",
          title,
          description: content,
          audience: target,
          postedByRole: req.user.role,
        });
      }

      console.log("Announcement created successfully");
      res.json({ message: "Announcement created successfully", announcementId: result.insertId });
    }
  );
};

// Get announcements by class (teachers/students see filtered list)
exports.getAnnouncementsByClass = (req, res) => {
  const classId = req.params.id;
  let audienceClause = "";
  if (req.user.role === "student") {
    audienceClause = " AND audience IN ('students','both')";
  } else if (req.user.role === "teacher") {
    audienceClause = " AND audience IN ('teachers','both')";
  } // coordinators see everything

  db.query(
    `SELECT * FROM announcements WHERE class_id = ?${audienceClause} ORDER BY created_at DESC`,
    [classId],
    (err, announcements) => {
      if (err) return res.status(500).json(err);
      res.json(announcements);
    }
  );
};

// Get announcements by subject
exports.getAnnouncementsBySubject = (req, res) => {
  const subjectId = req.params.id;
  let audienceClause = "";
  if (req.user.role === "student") {
    audienceClause = " AND audience IN ('students','both')";
  } else if (req.user.role === "teacher") {
    audienceClause = " AND audience IN ('teachers','both')";
  }

  db.query(
    `SELECT * FROM announcements WHERE subject_id = ?${audienceClause} ORDER BY created_at DESC`,
    [subjectId],
    (err, announcements) => {
      if (err) {
        console.error("Error getting announcements by subject:", err);
        return res.status(500).json(err);
      }
      res.json(announcements);
    }
  );
};

// Get announcements available to a student (classes they joined)
exports.getAnnouncementsForStudent = (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Only student allowed" });
  }

  const userId = req.user.id;
  db.query(
    `SELECT a.* FROM announcements a
     JOIN class_members cm ON cm.class_id = a.class_id
     WHERE cm.user_id = ? AND a.audience IN ('students','both') ORDER BY a.created_at DESC`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
};

// Teacher deletes their own subject announcement (based on subject ownership)
exports.deleteAnnouncement = (req, res) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ message: "Only teacher allowed" });
  }

  const announcementId = req.params.id;

  db.query(
    `SELECT a.id
     FROM announcements a
     JOIN subjects s ON s.id = a.subject_id
     WHERE a.id = ? AND s.teacher_id = ?`,
    [announcementId, req.user.id],
    (err, rows) => {
      if (err) {
        console.error("Error checking announcement ownership:", err);
        return res.status(500).json({ message: "Error checking announcement", error: err.message });
      }

      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: "Announcement not found or not owned by teacher" });
      }

      db.query("DELETE FROM announcements WHERE id = ?", [announcementId], (deleteErr) => {
        if (deleteErr) {
          console.error("Error deleting announcement:", deleteErr);
          return res.status(500).json({ message: "Failed to delete announcement", error: deleteErr.message });
        }

        return res.json({ message: "Announcement deleted successfully" });
      });
    }
  );
};
