const db = require("./config/db");

// Ensure classes and class_members exist on fresh databases.
exports.createClassesTables = () => {
  const createClasses = `
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  coordinator_id INT NOT NULL,
  join_code VARCHAR(32) NOT NULL UNIQUE,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

  const createClassMembers = `
CREATE TABLE IF NOT EXISTS class_members (
  id SERIAL PRIMARY KEY,
  class_id INT NOT NULL,
  user_id INT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student','teacher','coordinator')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_class_member UNIQUE (class_id, user_id)
);
`;

  console.log("Creating classes table if not exists...");
  db.query(createClasses, (err) => {
    if (err) {
      console.error("Error creating classes table:", err);
      return;
    }

    console.log("Classes table ready");
    console.log("Creating class_members table if not exists...");

    db.query(createClassMembers, (err2) => {
      if (err2) console.error("Error creating class_members table:", err2);
      else console.log("class_members table ready");
    });
  });
};
