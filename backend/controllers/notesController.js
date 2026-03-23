const db = require("../config/db");
const { notifyStudentsForClassContent } = require("../utils/classNotificationMailer");

// Teacher creates a note
exports.createNote = (req, res) => {
  if (req.user.role !== "teacher")
    return res.status(403).json({ message: "Only teacher allowed" });

  const { title, description, subject_id, class_id } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const file = req.file.filename;

  db.query(
    "INSERT INTO notes (title,description,subject_id,class_id,file) VALUES (?,?,?,?,?)",
    [title, description, subject_id, class_id, file],
    (err, result) => {
      if (err) {
        console.error("Note creation error:", err);
        return res.status(500).json({ message: "Error creating note", error: err });
      }

      notifyStudentsForClassContent({
        classId: class_id,
        subjectId: subject_id,
        type: "note",
        title,
        description,
      });

      res.json({ message: "Note created successfully", noteId: result.insertId });
    }
  );
};

// Get notes by class (for teacher view)
exports.getNotesByClass = (req, res) => {
  const classId = req.params.id;

  db.query(
    `SELECT * FROM notes WHERE class_id = ?`,
    [classId],
    (err, notes) => {
      if (err) return res.status(500).json(err);
      res.json(notes);
    }
  );
};

// Get notes by subject
exports.getNotesBySubject = (req, res) => {
  const subjectId = req.params.id;

  db.query(
    `SELECT * FROM notes WHERE subject_id = ?`,
    [subjectId],
    (err, notes) => {
      if (err) {
        console.error("Error getting notes by subject:", err);
        return res.status(500).json(err);
      }
      res.json(notes);
    }
  );
};

// Get notes available to a student (classes they joined)
exports.getNotesForStudent = (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Only student allowed" });
  }

  const userId = req.user.id;
  db.query(
    `SELECT n.* FROM notes n
     JOIN class_members cm ON cm.class_id = n.class_id
     WHERE cm.user_id = ?`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
};
