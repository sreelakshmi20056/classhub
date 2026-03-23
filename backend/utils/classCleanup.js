const db = require("../config/db");

// Clean up expired classes
exports.cleanupExpiredClasses = () => {
  db.query(
    "SELECT id FROM classes WHERE expires_at IS NOT NULL AND expires_at < NOW()",
    (err, expiredClasses) => {
      if (err) {
        console.error("Error finding expired classes:", err);
        return;
      }

      if (expiredClasses.length === 0) {
        console.log("No expired classes to clean up");
        return;
      }

      expiredClasses.forEach(classRecord => {
        deleteClassCascade(classRecord.id);
      });
    }
  );
};

// Cascade delete in proper order to respect foreign keys
const deleteClassCascade = (classId) => {
  // Step 1: Delete submissions (references assignments)
  db.query(
    "SELECT id FROM assignments WHERE class_id=?",
    [classId],
    (err, assignments) => {
      if (err) {
        console.error("Error fetching assignments:", err);
        return;
      }

      let deletedAssignments = 0;
      const totalAssignments = assignments.length;

      if (totalAssignments === 0) {
        // No assignments, skip to next step
        deleteSubjects(classId);
        return;
      }

      assignments.forEach(assignment => {
        // Delete submissions for this assignment
        db.query(
          "DELETE FROM submissions WHERE assignment_id=?",
          [assignment.id],
          (err) => {
            if (err) console.error("Error deleting submissions:", err);
            deletedAssignments++;

            // When all submissions are deleted, proceed to delete assignments
            if (deletedAssignments === totalAssignments) {
              deleteAssignments(classId);
            }
          }
        );
      });
    }
  );
};

const deleteAssignments = (classId) => {
  // Step 2: Delete assignments
  db.query(
    "DELETE FROM assignments WHERE class_id=?",
    [classId],
    (err) => {
      if (err) {
        console.error("Error deleting assignments:", err);
        return;
      }
      deleteSubjects(classId);
    }
  );
};

const deleteSubjects = (classId) => {
  // Step 3: Delete subjects
  db.query(
    "DELETE FROM subjects WHERE class_id=?",
    [classId],
    (err) => {
      if (err) {
        console.error("Error deleting subjects:", err);
        return;
      }
      deleteClassMembers(classId);
    }
  );
};

const deleteClassMembers = (classId) => {
  // Step 4: Delete class_members
  db.query(
    "DELETE FROM class_members WHERE class_id=?",
    [classId],
    (err) => {
      if (err) {
        console.error("Error deleting class members:", err);
        return;
      }
      deleteClass(classId);
    }
  );
};

const deleteClass = (classId) => {
  // Step 5: Delete the class itself
  db.query(
    "DELETE FROM classes WHERE id=?",
    [classId],
    (err) => {
      if (err) {
        console.error("Error deleting class:", err);
      } else {
        console.log(`Deleted expired class ID: ${classId}`);
      }
    }
  );
};

// Run cleanup periodically (every hour)
setInterval(exports.cleanupExpiredClasses, 60 * 60 * 1000);

