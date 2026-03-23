const db = require("../config/db");
const { notifyStudentsForClassContent } = require("../utils/classNotificationMailer");

// Teacher creates assignment
exports.createAssignment = (req, res) => {
  if (req.user.role !== "teacher")
    return res.status(403).json({ message: "Only teacher allowed" });

  const { title, description, subject_id, due_date, class_id } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const file = req.file.filename;

  // Convert datetime-local format (2026-03-14T10:30) to MySQL DATETIME format (2026-03-14 10:30:00)
  const mysqlDueDate = due_date.replace('T', ' ') + ':00';

  db.query(
    "INSERT INTO assignments (title,description,subject_id,class_id,due_date,file) VALUES (?,?,?,?,?,?)",
    [title, description, subject_id, class_id, mysqlDueDate, file],
    (err, result) => {
      if (err) {
        console.error("Assignment creation error:", err);
        return res.status(500).json({ message: "Error creating assignment", error: err });
      }

      notifyStudentsForClassContent({
        classId: class_id,
        subjectId: subject_id,
        type: "assignment",
        title,
        description,
        dueDate: mysqlDueDate,
      });

      res.json({ message: "Assignment created successfully", assignmentId: result.insertId });
    }
  );
};

// Get assignments by class (include subject name)
exports.getAssignmentsByClass = (req, res) => {
  const classId = req.params.id;

  db.query(
    `SELECT a.*, s.name AS subject_name
     FROM assignments a
     LEFT JOIN subjects s ON s.id = a.subject_id
     WHERE a.class_id = ?`,
    [classId],
    (err, assignments) => {
      if (err) return res.status(500).json(err);
      console.log("backend assignments for class", assignments);
      res.json(assignments);
    }
  );
};

// Get assignments by subject
exports.getAssignmentsBySubject = (req, res) => {
  const subjectId = req.params.id;

  console.log("Getting assignments for subject:", subjectId);

  db.query(
    `SELECT * FROM assignments WHERE subject_id = ?`,
    [subjectId],
    (err, assignments) => {
      if (err) {
        console.error("Error getting assignments by subject:", err);
        return res.status(500).json(err);
      }
      console.log("Assignments found:", assignments.length);
      res.json(assignments);
    }
  );
};

// Get assignments available to a student (classes they joined)
exports.getAssignmentsForStudent = (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Only student allowed" });
  }

  const userId = req.user.id;
  db.query(
    `SELECT a.* FROM assignments a
     JOIN class_members cm ON cm.class_id = a.class_id
     WHERE cm.user_id = ?`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
};