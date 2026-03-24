require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

const authRoutes = require("./routes/authRoutes");
const classRoutes = require("./routes/classRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const notesRoutes = require("./routes/notesRoutes");
const announcementRoutes = require("./routes/announcementRoutes");

// ensure the notes and announcements tables exist when server starts
const { createNotesTable } = require("./createNotesTable");
const { createAnnouncementsTable } = require("./createAnnouncementsTable");
const { createSubjectsTable } = require("./createSubjectsTable");
createNotesTable();
createAnnouncementsTable();
createSubjectsTable();

const { cleanupExpiredClasses } = require("./utils/classCleanup");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/uploads", express.static("uploads"));

// Run cleanup on startup
cleanupExpiredClasses();

app.listen(4000, () => console.log("Server running on 4000"));