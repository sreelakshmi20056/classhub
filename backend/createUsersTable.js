const db = require("./config/db");

// Ensure users table exists for auth flows on fresh databases.
exports.createUsersTable = () => {
  const create = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student','teacher','coordinator')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

  console.log("Creating users table if not exists...");
  db.query(create, (err) => {
    if (err) console.error("Error creating users table:", err);
    else console.log("Users table ready");
  });
};
