require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");



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
const { createClassesTables } = require("./createClassesTable");
const { createSubjectsTable } = require("./createSubjectsTable");
const { createUsersTable } = require("./createUsersTable");
const {
  createAssignmentsAndSubmissionsTables,
} = require("./createAssignmentsAndSubmissionsTables");
createUsersTable();
createNotesTable();
createAnnouncementsTable();
createClassesTables();
createSubjectsTable();
createAssignmentsAndSubmissionsTables();

const { cleanupExpiredClasses } = require("./utils/classCleanup");

const app = express();
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests and local development when FRONTEND_URL is not set.
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/uploads", express.static(uploadsDir));

// Run cleanup on startup
cleanupExpiredClasses();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));