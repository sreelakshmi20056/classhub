const mysql = require("mysql2");

const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_PASS", "DB_NAME", "DB_PORT"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required DB environment variables: ${missingEnvVars.join(", ")}`);
}

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect(err => {
  if (err) console.log("MySQL connection error:", err.message);
  else console.log("MySQL Connected ✅");
});

db.on("error", (err) => {
  console.error("MySQL runtime error:", err.message);
});

module.exports = db;