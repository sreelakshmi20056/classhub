const db = require("./config/db");

// Add duration and expires_at columns to classes table
const addDurationColumn = () => {
  db.query(`ALTER TABLE classes ADD COLUMN duration INT DEFAULT 30`, (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') {
      console.error("Error adding duration column:", err);
    } else {
      console.log("Duration column added");
    }
    addExpiresAtColumn();
  });
};

const addExpiresAtColumn = () => {
  db.query(`ALTER TABLE classes ADD COLUMN expires_at DATETIME`, (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') {
      console.error("Error adding expires_at column:", err);
    } else {
      console.log("Expires_at column added");
    }
    db.end();
  });
};

addDurationColumn();

