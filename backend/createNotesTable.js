const db = require("./config/db");

// createNotesTable exports a function that ensures the notes table exists
// using the shared database connection without closing it.
exports.createNotesTable = () => {
  const create = `
CREATE TABLE IF NOT EXISTS notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  subject_id INT,
  class_id INT,
  file VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

  console.log("Creating notes table if not exists...");
  db.query(create, (err, result) => {
    if (err) console.error("Error creating notes table:", err);
    else console.log("Notes table ready");
    // do not close the db connection here, server uses it
  });
};
