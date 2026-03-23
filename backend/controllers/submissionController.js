const db = require("../config/db");

exports.submitAssignment = (req, res) => {
  if (req.user.role !== "student")
    return res.status(403).json({ message: "Only student allowed" });

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const file = req.file.filename;
  const assignment_id = req.body.assignment_id;

  console.log("Submission request body:", req.body);
  console.log("Uploaded file:", req.file);

  // Check if student has already submitted for this assignment
  db.query(
    "SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?",
    [assignment_id, req.user.id],
    (err, results) => {
      if (err) {
        console.error("Error checking existing submission:", err);
        return res.status(500).json({ message: "Error checking submission", error: err });
      }
      if (results.length > 0) {
        return res.status(400).json({ message: "You have already submitted for this assignment" });
      }

      // check due date
      db.query(
        "SELECT due_date FROM assignments WHERE id = ?",
        [assignment_id],
        (err2, assignRows) => {
          if (err2) {
            console.error("Error fetching assignment due date:", err2);
            return res.status(500).json({ message: "Error checking assignment", error: err2 });
          }
          if (assignRows.length === 0) {
            return res.status(404).json({ message: "Assignment not found" });
          }
          const dueDate = new Date(assignRows[0].due_date);
          if (dueDate < new Date()) {
            return res.status(400).json({ message: "Assignment expired" });
          }

          // Proceed to insert
          db.query(
            "INSERT INTO submissions (assignment_id,student_id,file_url) VALUES (?,?,?)",
            [assignment_id, req.user.id, file],
            (err3) => {
              if (err3) {
                console.error("Submission error:", err3);
                return res.status(500).json({ message: "Error submitting assignment", error: err3 });
              }
              res.json({ message: "Submitted successfully", file_url: file });
            }
          );
        }
      );
    }
  );
};

// Get student's own submissions
exports.getStudentSubmissions = (req, res) => {
  if (req.user.role !== "student")
    return res.status(403).json({ message: "Only student allowed" });

  db.query(
    "SELECT assignment_id, file_url FROM submissions WHERE student_id = ?",
    [req.user.id],
    (err, results) => {
      if (err) {
        console.error("Error getting student submissions:", err);
        return res.status(500).json({ message: "Error fetching submissions", error: err });
      }
      res.json(results);
    }
  );
};

// Get submissions for an assignment (for teachers)
exports.getSubmissionsForAssignment = (req, res) => {
  const assignmentId = req.params.id;

  db.query(
    `SELECT s.id, s.file_url, s.submitted_at, u.id AS student_id, u.name
     FROM submissions s
     JOIN users u ON s.student_id = u.id
     WHERE s.assignment_id = ?
     ORDER BY u.name ASC`,
    [assignmentId],
    (err, results) => {
      if (err) {
        console.error("Error getting submissions:", err);
        return res.status(500).json({ message: "Error fetching submissions", error: err });
      }
      res.json(results);
    }
  );
};