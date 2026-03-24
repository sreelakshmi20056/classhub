const db = require("./config/db");

// createAnnouncementsTable exports a function that ensures the announcements table exists
// using the shared database connection without closing it.
exports.createAnnouncementsTable = () => {
  const create = `
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  content TEXT,
  subject_id INT,
  class_id INT,
  audience VARCHAR(20) DEFAULT 'both' CHECK (audience IN ('students','teachers','both')),
  file VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

  console.log("Creating announcements table if not exists...");
  db.query(create, (err, result) => {
    if (err) console.error("Error creating announcements table:", err);
    else console.log("Announcements table ready");
    // make sure audience column exists on older installs
    const alter = `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS audience VARCHAR(20) DEFAULT 'both';`;
    db.query(alter, (err2) => {
      if (err2 && err2.code !== 'ER_DUP_FIELDNAME') {
        // ER_DUP_FIELDNAME means column already exists, which is fine
        console.error("Error ensuring audience column:", err2);
      }
    });
    // do not close the db connection here, server uses it
  });
};
