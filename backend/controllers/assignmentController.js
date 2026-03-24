const db = require("../config/db");
const { notifyStudentsForClassContent } = require("../utils/classNotificationMailer");
const { persistUploadedFile } = require("../utils/fileStorage");

const normalizeDueDateForDb = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const normalized = raw.replace("T", " ");
  return normalized.length === 16 ? `${normalized}:00` : normalized;
};

const parseLocalDateTime = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const parts = raw.replace(" ", "T").split(/[-T:]/).map((n) => Number(n));
  if (parts.length < 5 || parts.some((n) => Number.isNaN(n))) return null;

  const [year, month, day, hour, minute, second = 0] = parts;
  return new Date(year, month - 1, day, hour, minute, second);
};

// Teacher creates assignment
exports.createAssignment = async (req, res) => {
  if (req.user.role !== "teacher")
    return res.status(403).json({ message: "Only teacher allowed" });

  const { title, description, subject_id, due_date, class_id } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  let file;
  try {
    file = await persistUploadedFile(req.file, "assignments");
  } catch (storageError) {
    console.error("Assignment file upload error:", storageError);
    return res.status(500).json({ message: "Error storing assignment file", error: storageError.message });
  }

  const assignmentDueDate = normalizeDueDateForDb(due_date);
  if (!assignmentDueDate) {
    return res.status(400).json({ message: "Please provide a valid due date" });
  }

  const parsedDueDate = parseLocalDateTime(assignmentDueDate);
  if (!parsedDueDate) {
    return res.status(400).json({ message: "Please provide a valid due date" });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dueDateStart = new Date(parsedDueDate);
  dueDateStart.setHours(0, 0, 0, 0);

  if (dueDateStart <= todayStart) {
    return res.status(400).json({ message: "Due date must be after today" });
  }

  db.query(
    "INSERT INTO assignments (title,description,subject_id,class_id,due_date,file) VALUES (?,?,?,?,?,?)",
    [title, description, subject_id, class_id, assignmentDueDate, file],
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
        dueDate: assignmentDueDate,
      });

      res.json({ message: "Assignment created successfully", assignmentId: result.insertId });
    }
  );
};

// Get assignments by class (include subject name)
exports.getAssignmentsByClass = (req, res) => {
  const classId = req.params.id;

  db.query(
    `SELECT a.id, a.title, a.description, a.subject_id, a.class_id,
            TO_CHAR(a.due_date, 'YYYY-MM-DD"T"HH24:MI:SS') AS due_date,
            a.file, a.created_at, s.name AS subject_name
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
    `SELECT id, title, description, subject_id, class_id,
            TO_CHAR(due_date, 'YYYY-MM-DD"T"HH24:MI:SS') AS due_date,
            file, created_at
     FROM assignments
     WHERE subject_id = ?`,
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
    `SELECT a.id, a.title, a.description, a.subject_id, a.class_id,
            TO_CHAR(a.due_date, 'YYYY-MM-DD"T"HH24:MI:SS') AS due_date,
            a.file, a.created_at
     FROM assignments a
     JOIN class_members cm ON cm.class_id = a.class_id
     WHERE cm.user_id = ?`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
};