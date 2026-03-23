const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.createClass = (req, res) => {
  if (req.user.role !== "coordinator")
    return res.json({ message: "Only coordinator allowed" });

  // Check if coordinator already has a class
  db.query(
    "SELECT id FROM classes WHERE coordinator_id=?",
    [req.user.id],
    (err, existingClasses) => {
      if (err) return res.status(500).json(err);
      if (existingClasses.length > 0) {
        return res.status(400).json({ message: "You can only create one class" });
      }

      const { name, expires_at } = req.body;
      const joinCode = uuidv4().substring(0, 6);

      if (!expires_at) {
        return res.status(400).json({ message: "Expiration date and time is required" });
      }

      const expiryDate = new Date(expires_at);
      if (Number.isNaN(expiryDate.getTime())) {
        return res.status(400).json({ message: "Invalid expiration date and time" });
      }

      const expiryDateOnly = new Date(expiryDate);
      expiryDateOnly.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expiryDateOnly <= today) {
        return res.status(400).json({ message: "Expiration must be from tomorrow onwards" });
      }

      db.query(
        "INSERT INTO classes (name, coordinator_id, join_code, expires_at) VALUES (?, ?, ?, ?)",
        [name, req.user.id, joinCode, expires_at],
        err => {
          if (err) return res.status(500).json(err);

          res.json({
            message: "Class created",
            joinCode,
            expiresAt: expires_at
          });
        }
      );
    }
  );
};

exports.joinClass = (req, res) => {
  const { join_code } = req.body;

  if (!join_code) {
    return res.status(400).json({ message: "Class code is required" });
  }

  db.query(
    "SELECT * FROM classes WHERE join_code=?",
    [join_code],
    (err, classResult) => {
      if (err) return res.status(500).json(err);
      if (classResult.length === 0)
        return res.status(404).json({ message: "Invalid class code" });

      const classId = classResult[0].id;

      // Students should only be able to join one class
      const isStudent = String(req.user.role || "").toLowerCase() === "student";

      if (isStudent) {
        // First ensure they are not already a member of this class
        db.query(
          "SELECT * FROM class_members WHERE class_id=? AND user_id=?",
          [classId, req.user.id],
          (err2, memberResult) => {
            if (err2) return res.status(500).json(err2);
            if (memberResult.length > 0)
              return res.json({ message: "Already joined" });

            // Then ensure they are not a member of any other class
            db.query(
              "SELECT * FROM class_members WHERE user_id=?",
              [req.user.id],
              (err3, otherClasses) => {
                if (err3) return res.status(500).json(err3);
                if (otherClasses.length > 0) {
                  return res.status(400).json({ message: "A student can only join one class" });
                }

                db.query(
                  "INSERT INTO class_members (class_id,user_id,role) VALUES (?,?,?)",
                  [classId, req.user.id, req.user.role],
                  (err4) => {
                    if (err4) return res.status(500).json(err4);

                    res.json({ message: "Joined successfully" });
                  }
                );
              }
            );
          }
        );
      } else {
        // Non-students (e.g., teachers) can join multiple classes
        db.query(
          "SELECT * FROM class_members WHERE class_id=? AND user_id=?",
          [classId, req.user.id],
          (err2, memberResult) => {
            if (err2) return res.status(500).json(err2);
            if (memberResult.length > 0) return res.json({ message: "Already joined" });

            db.query(
              "INSERT INTO class_members (class_id,user_id,role) VALUES (?,?,?)",
              [classId, req.user.id, req.user.role],
              (err3) => {
                if (err3) return res.status(500).json(err3);

                res.json({ message: "Joined successfully" });
              }
            );
          }
        );
      }
    }
  );
};
// Get classes created by coordinator
exports.getCreatedClasses = (req, res) => {
  if (req.user.role !== "coordinator")
    return res.json({ message: "Only coordinator allowed" });

  db.query(
    "SELECT * FROM classes WHERE coordinator_id = ?",
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
};

// Get classes joined by teacher/student
exports.getJoinedClasses = (req, res) => {
  db.query(
    `SELECT c.*
     FROM classes c
     JOIN class_members cm ON c.id = cm.class_id
     WHERE cm.user_id = ?`,
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
};
exports.getClassDetails = (req, res) => {
  const { classId } = req.params;

  // Get class info
  db.query("SELECT * FROM classes WHERE id=?", [classId], (err, classResult) => {
    if (err) return res.status(500).json(err);

    // Get teachers
    db.query(
      "SELECT u.id,u.name,u.email FROM users u JOIN class_members cm ON u.id=cm.user_id WHERE cm.class_id=? AND cm.role='teacher'",
      [classId],
      (err2, teachers) => {

        // Get students
        db.query(
          "SELECT u.id,u.name,u.email FROM users u JOIN class_members cm ON u.id=cm.user_id WHERE cm.class_id=? AND cm.role='student'",
          [classId],
          (err3, students) => {

            // Get subjects
            db.query(
              "SELECT * FROM subjects WHERE class_id=?",
              [classId],
              (err4, subjects) => {

                res.json({
                  classInfo: classResult[0],
                  teachers,
                  students,
                  subjects
                });

              }
            );
          }
        );
      }
    );
  });
};

// Get students in a class
exports.getClassStudents = (req, res) => {
  const { classId } = req.params;

  db.query(
    "SELECT u.id,u.name,u.email FROM users u JOIN class_members cm ON u.id=cm.user_id WHERE cm.class_id=? AND cm.role='student'",
    [classId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
};

// Generate a meeting link using Jitsi Meet (open source, no API required)
// This creates a real, joinable meeting where the teacher becomes the host
exports.createMeetLink = (req, res) => {
  // Generate a random room name
  const generateRoomName = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'classhub-';
    for (let i = 0; i < 8; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };
  const roomName = generateRoomName();
  const url = `https://meet.jit.si/${roomName}`;
  res.json({ url });
};

// Teacher exits from a class
// Removes subjects created by teacher, their notes/announcements/assignments/submissions, and removes teacher from class
exports.exitClass = (req, res) => {
  const { classId } = req.params;
  const userId = req.user.id;

  console.log(`Teacher ${userId} attempting to exit class ${classId}`);

  // Verify teacher is in the class
  db.query(
    "SELECT * FROM class_members WHERE class_id=? AND user_id=? AND role='teacher'",
    [classId, userId],
    (err, memberResult) => {
      if (err) {
        console.error("Error checking class membership:", err);
        return res.status(500).json({ message: "Database error", error: err.message });
      }
      if (memberResult.length === 0) {
        console.log(`Teacher ${userId} is not a member of class ${classId}`);
        return res.status(400).json({ message: "You are not a teacher in this class" });
      }

      console.log(`Teacher ${userId} is confirmed in class ${classId}, proceeding with exit`);

      // Get subject IDs first
      db.query(
        "SELECT id FROM subjects WHERE class_id=? AND teacher_id=?",
        [classId, userId],
        (err2, subjects) => {
          if (err2) {
            console.error("Error getting subjects:", err2);
            return res.status(500).json({ message: "Failed to get subjects", error: err2.message });
          }

          const subjectIds = subjects.map(s => s.id);
          console.log(`Found ${subjectIds.length} subjects to delete:`, subjectIds);

          if (subjectIds.length === 0) {
            // No subjects, just remove teacher from class
            console.log("No subjects found, removing teacher from class only");
            return db.query(
              "DELETE FROM class_members WHERE class_id=? AND user_id=? AND role='teacher'",
              [classId, userId],
              (err3) => {
                if (err3) {
                  console.error("Error removing teacher from class:", err3);
                  return res.status(500).json({ message: "Failed to remove teacher from class", error: err3.message });
                }
                console.log("Teacher successfully removed from class");
                res.json({ message: "Successfully exited class" });
              }
            );
          }

          // Delete submissions for assignments of these subjects
          const placeholders = subjectIds.map(() => '?').join(',');
          db.query(
            `DELETE FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE subject_id IN (${placeholders}))`,
            subjectIds,
            (err3) => {
              if (err3) {
                console.error("Error deleting submissions:", err3);
                return res.status(500).json({ message: "Failed to delete submissions", error: err3.message });
              }

              console.log("Submissions deleted successfully");

              // Delete assignments for these subjects
              db.query(
                `DELETE FROM assignments WHERE subject_id IN (${placeholders})`,
                subjectIds,
                (err4) => {
                  if (err4) {
                    console.error("Error deleting assignments:", err4);
                    return res.status(500).json({ message: "Failed to delete assignments", error: err4.message });
                  }

                  console.log("Assignments deleted successfully");

                  // Delete notes for these subjects
                  db.query(
                    `DELETE FROM notes WHERE subject_id IN (${placeholders})`,
                    subjectIds,
                    (err5) => {
                      if (err5) {
                        console.error("Error deleting notes:", err5);
                        return res.status(500).json({ message: "Failed to delete notes", error: err5.message });
                      }

                      console.log("Notes deleted successfully");

                      // Delete announcements for these subjects
                      db.query(
                        `DELETE FROM announcements WHERE subject_id IN (${placeholders})`,
                        subjectIds,
                        (err6) => {
                          if (err6) {
                            console.error("Error deleting announcements:", err6);
                            return res.status(500).json({ message: "Failed to delete announcements", error: err6.message });
                          }

                          console.log("Announcements deleted successfully");

                          // Delete the subjects
                          db.query(
                            `DELETE FROM subjects WHERE id IN (${placeholders})`,
                            subjectIds,
                            (err7) => {
                              if (err7) {
                                console.error("Error deleting subjects:", err7);
                                return res.status(500).json({ message: "Failed to delete subjects", error: err7.message });
                              }

                              console.log("Subjects deleted successfully");

                              // Finally, remove teacher from class_members
                              db.query(
                                "DELETE FROM class_members WHERE class_id=? AND user_id=? AND role='teacher'",
                                [classId, userId],
                                (err8) => {
                                  if (err8) {
                                    console.error("Error removing teacher from class:", err8);
                                    return res.status(500).json({ message: "Failed to remove teacher from class", error: err8.message });
                                  }

                                  console.log("Teacher successfully exited class");
                                  res.json({ message: "Successfully exited class" });
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
};

// Student exits from a class
// Removes student's submissions and removes student from class
exports.exitClassStudent = (req, res) => {
  const { classId } = req.params;
  const userId = req.user.id;

  console.log(`Student ${userId} attempting to exit class ${classId}`);

  // Verify student is in the class
  db.query(
    "SELECT * FROM class_members WHERE class_id=? AND user_id=? AND role='student'",
    [classId, userId],
    (err, memberResult) => {
      if (err) {
        console.error("Error checking class membership:", err);
        return res.status(500).json({ message: "Database error", error: err.message });
      }
      if (memberResult.length === 0) {
        console.log(`Student ${userId} is not a member of class ${classId}`);
        return res.status(400).json({ message: "You are not a student in this class" });
      }

      console.log(`Student ${userId} is confirmed in class ${classId}, proceeding with exit`);

      // Get all assignments in this class to find student's submissions
      db.query(
        `DELETE FROM submissions WHERE student_id=? AND assignment_id IN (SELECT a.id FROM assignments a JOIN subjects s ON a.subject_id=s.id WHERE s.class_id=?)`,
        [userId, classId],
        (err2) => {
          if (err2) {
            console.error("Error deleting student submissions:", err2);
            return res.status(500).json({ message: "Failed to delete submissions", error: err2.message });
          }

          console.log("Student submissions deleted successfully");

          // Remove student from class_members
          db.query(
            "DELETE FROM class_members WHERE class_id=? AND user_id=? AND role='student'",
            [classId, userId],
            (err3) => {
              if (err3) {
                console.error("Error removing student from class:", err3);
                return res.status(500).json({ message: "Failed to remove student from class", error: err3.message });
              }

              console.log("Student successfully exited class");
              res.json({ message: "Successfully exited class" });
            }
          );
        }
      );
    }
  );
};