const db = require("../config/db");
const { sendEmail } = require("./mailer");

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

const buildMessage = ({ type, className, subjectName, title, description, dueDate, postedByRole }) => {
  const normalizedType = (type || "content").toLowerCase();
  const poster = postedByRole || "teacher";
  const subjectPart = subjectName ? `\nSubject: ${subjectName}` : "";
  const classPart = className ? `\nClass: ${className}` : "";
  const descriptionPart = description ? `\nDetails: ${description}` : "";
  const duePart = dueDate ? `\nDue Date: ${new Date(dueDate).toLocaleString()}` : "";

  let subjectLine = "ClassHub Update";
  if (normalizedType === "note") subjectLine = "New Note Posted";
  if (normalizedType === "assignment") subjectLine = "New Assignment Posted";
  if (normalizedType === "announcement") subjectLine = "New Announcement Posted";

  const text =
    `Hello,\n\n` +
    `A new ${normalizedType} has been posted by your ${poster} on ClassHub.` +
    `\nTitle: ${title || "Untitled"}` +
    classPart +
    subjectPart +
    duePart +
    descriptionPart +
    `\n\nPlease log in to ClassHub to view the full update.` +
    `\n\n- ClassHub Team`;

  return { subjectLine, text };
};

const buildRoleClauseForAudience = (audience) => {
  if (audience === "students") return "cm.role = 'student'";
  if (audience === "teachers") return "cm.role = 'teacher'";
  return "cm.role IN ('student','teacher')";
};

const notifyAudienceForClassContent = async ({
  classId,
  subjectId,
  type,
  title,
  description,
  dueDate,
  audience = "students",
  postedByRole,
}) => {
  if (!classId) return;

  try {
    const roleClause = buildRoleClauseForAudience(audience);
    const [classRows, subjectRows, recipientRows] = await Promise.all([
      dbQuery("SELECT name FROM classes WHERE id = ? LIMIT 1", [classId]),
      subjectId
        ? dbQuery("SELECT name FROM subjects WHERE id = ? LIMIT 1", [subjectId])
        : Promise.resolve([]),
      dbQuery(
        `SELECT DISTINCT u.email
         FROM users u
         JOIN class_members cm ON cm.user_id = u.id
         WHERE cm.class_id = ? AND ${roleClause} AND u.email IS NOT NULL AND u.email <> ''`,
        [classId]
      ),
    ]);

    if (!recipientRows.length) return;

    const className = classRows[0]?.name || "Your Class";
    const subjectName = subjectRows[0]?.name || "";
    const recipients = recipientRows.map((row) => row.email);
    const { subjectLine, text } = buildMessage({
      type,
      className,
      subjectName,
      title,
      description,
      dueDate,
      postedByRole,
    });

    await sendEmail({
      to: recipients,
      subject: subjectLine,
      text,
    });
  } catch (error) {
    console.error("Failed to send class content notification emails", error);
  }
};

const notifyStudentsForClassContent = async ({
  classId,
  subjectId,
  type,
  title,
  description,
  dueDate,
}) => {
  return notifyAudienceForClassContent({
    classId,
    subjectId,
    type,
    title,
    description,
    dueDate,
    audience: "students",
    postedByRole: "teacher",
  });
};

module.exports = {
  notifyAudienceForClassContent,
  notifyStudentsForClassContent,
};
