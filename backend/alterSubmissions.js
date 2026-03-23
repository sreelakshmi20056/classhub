const db = require("./config/db");

db.query(`ALTER TABLE submissions ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`, (err, result) => {
  if (err) console.error("Error altering table:", err);
  else console.log("Table altered successfully");
  db.end();
});