const db = require("./config/db");

// Ensure assignments and submissions tables exist for assignment workflows.
exports.createAssignmentsAndSubmissionsTables = () => {
  const createAssignments = `
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  subject_id INT,
  class_id INT,
  due_date TIMESTAMP,
  file VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

  const createSubmissions = `
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  file_url VARCHAR(255),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uniq_submission_assignment_student UNIQUE (assignment_id, student_id)
);
`;

  console.log("Creating assignments table if not exists...");
  db.query(createAssignments, (assignmentsErr) => {
    if (assignmentsErr) {
      console.error("Error creating assignments table:", assignmentsErr);
      return;
    }

    console.log("Assignments table ready");
    console.log("Creating submissions table if not exists...");

    db.query(createSubmissions, (submissionsErr) => {
      if (submissionsErr) {
        console.error("Error creating submissions table:", submissionsErr);
        return;
      }
      console.log("Submissions table ready");
    });
  });
};
