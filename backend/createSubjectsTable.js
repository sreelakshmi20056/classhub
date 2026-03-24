const db = require("./config/db");

// createSubjectsTable exports a function that ensures the subjects table exists
// using the shared database connection without closing it.
exports.createSubjectsTable = () => {
  const create = `
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  class_id INT NOT NULL,
  teacher_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

  console.log("Creating subjects table if not exists...");
  db.query(create, (err, result) => {
    if (err) console.error("Error creating subjects table:", err);
    else console.log("Subjects table ready");
    // do not close the db connection here, server uses it
  });
};