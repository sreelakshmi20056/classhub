const db = require("../config/db");

// Teacher creates subject inside joined class
exports.createSubject = (req, res) => {
  if (req.user.role !== "teacher")
    return res.json({ message: "Only teacher allowed" });

  const { name, class_id } = req.body;

  // Check if teacher joined this class
  db.query(
    "SELECT * FROM class_members WHERE class_id=? AND user_id=?",
    [class_id, req.user.id],
    (err, result) => {
      if (result.length === 0)
        return res.json({ message: "You have not joined this class" });

      // Check if teacher already has a subject in this class
      db.query(
        "SELECT id FROM subjects WHERE class_id=? AND teacher_id=?",
        [class_id, req.user.id],
        (err2, existingSubjects) => {
          if (err2) return res.status(500).json(err2);
          if (existingSubjects.length > 0) {
            return res.status(400).json({ message: "You can only create one subject per class" });
          }

          db.query(
            "INSERT INTO subjects (name,class_id,teacher_id) VALUES (?,?,?)",
            [name, class_id, req.user.id],
            (err3) => {
              if (err3) return res.status(500).json(err3);
              res.json({ message: "Subject created" });
            }
          );
        }
      );
    }
  );
};

// Get subjects of a class
// Teachers see only their subjects, students see all subjects in the class
exports.getSubjectsByClass = (req, res) => {
  const { classId } = req.params;

  if (req.user.role === "teacher") {
    // Teachers see only their own subjects
    db.query(
      "SELECT * FROM subjects WHERE class_id=? AND teacher_id=?",
      [classId, req.user.id],
      (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
      }
    );
  } else {
    // Students see all subjects in the class
    db.query(
      "SELECT * FROM subjects WHERE class_id=?",
      [classId],
      (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
      }
    );
  }
};