const db = require("../config/db");
const { sendEmail } = require("./mailer");

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const REMINDER_TYPE = "due_1_day";

const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results);
    });
  });
};

const ensureReminderTable = async () => {
  await dbQuery(
    `CREATE TABLE IF NOT EXISTS assignment_reminders (
      id SERIAL PRIMARY KEY,
      assignment_id INT NOT NULL,
      student_id INT NOT NULL,
      reminder_type VARCHAR(50) NOT NULL,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uniq_assignment_student_type UNIQUE (assignment_id, student_id, reminder_type)
    )`
  );
};

const getPendingDueSoonSubmissions = async () => {
  // Send one reminder when an assignment enters the next 24 hours window.
  return dbQuery(
    `SELECT
      a.id AS assignment_id,
      a.title AS assignment_title,
      a.description AS assignment_description,
      a.due_date,
      c.name AS class_name,
      subj.name AS subject_name,
      u.id AS student_id,
      u.name AS student_name,
      u.email AS student_email
     FROM assignments a
     JOIN classes c ON c.id = a.class_id
     LEFT JOIN subjects subj ON subj.id = a.subject_id
    JOIN class_members cm ON cm.class_id = a.class_id AND LOWER(cm.role) = 'student'
     JOIN users u ON u.id = cm.user_id
     LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = u.id
     LEFT JOIN assignment_reminders ar
       ON ar.assignment_id = a.id
      AND ar.student_id = u.id
      AND ar.reminder_type = ?
     WHERE a.due_date IS NOT NULL
       AND a.due_date > NOW()
       AND a.due_date <= NOW() + INTERVAL '24 hours'
       AND s.id IS NULL
       AND ar.id IS NULL
       AND u.email IS NOT NULL
       AND u.email <> ''`,
    [REMINDER_TYPE]
  );
};

const buildReminderEmail = (row) => {
  const due = new Date(row.due_date).toLocaleString();
  const studentName = row.student_name || "Student";
  const className = row.class_name || "your class";
  const subjectName = row.subject_name ? `\nSubject: ${row.subject_name}` : "";
  const descriptionPart = row.assignment_description
    ? `\nAssignment Details: ${row.assignment_description}`
    : "";

  return {
    subject: "Assignment Reminder - Due in 1 Day",
    text:
      `Hi ${studentName},\n\n` +
      `This is a reminder that your assignment is due in approximately 1 day.\n\n` +
      `Class: ${className}` +
      `${subjectName}` +
      `\nAssignment: ${row.assignment_title || "Untitled"}` +
      `\nDue: ${due}` +
      `${descriptionPart}` +
      `\n\nPlease submit before the deadline on ClassHub.\n\n- ClassHub Team`,
  };
};

const markReminderSent = async (assignmentId, studentId) => {
  await dbQuery(
    `INSERT INTO assignment_reminders (assignment_id, student_id, reminder_type)
     VALUES (?, ?, ?)
     ON CONFLICT (assignment_id, student_id, reminder_type) DO NOTHING`,
    [assignmentId, studentId, REMINDER_TYPE]
  );
};

const runAssignmentDueReminderCheck = async () => {
  try {
    const pendingRows = await getPendingDueSoonSubmissions();
    console.log(`[AssignmentReminder] Pending reminder count: ${pendingRows.length}`);

    for (const row of pendingRows) {
      try {
        const { subject, text } = buildReminderEmail(row);
        const sent = await sendEmail({
          to: row.student_email,
          subject,
          text,
        });

        if (sent) {
          await markReminderSent(row.assignment_id, row.student_id);
        }
      } catch (emailError) {
        console.error("Failed to send assignment due reminder email", emailError);
      }
    }
  } catch (error) {
    console.error("Assignment reminder job failed", error);
  }
};

const startAssignmentDueReminderJob = async () => {
  try {
    await ensureReminderTable();
    await runAssignmentDueReminderCheck();
    setInterval(runAssignmentDueReminderCheck, FIVE_MINUTES_MS);
    console.log("Assignment due reminder job started (every 5 minutes)");
  } catch (error) {
    console.error("Unable to start assignment reminder job", error);
  }
};

module.exports = {
  startAssignmentDueReminderJob,
};
