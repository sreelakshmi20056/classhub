import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import API from "../api";

function AssignmentSubmissionsPage() {
  const { id } = useParams();
  const location = useLocation();
  const classId = location.state?.classId;
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
    if (classId) {
      loadStudents();
    }
    loadAssignment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const loadSubmissions = async () => {
    try {
      const res = await API.get(`/submissions/assignment/${id}`);
      setSubmissions(res.data);
    } catch (err) {
      console.error("Failed to load submissions", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!classId) return;
    try {
      const res = await API.get(`/classes/${classId}/students`);
      const sorted = res.data.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setStudents(sorted);
    } catch (err) {
      console.error("Failed to load students", err);
    }
  };

  const loadAssignment = async () => {
    if (!classId) return;
    try {
      // Fetch assignments for the class and find the matching one.
      const res = await API.get(`/assignments/class/${classId}`);
      const foundAssignment = res.data.find((a) => a.id === Number(id));
      if (foundAssignment) {
        setAssignment(foundAssignment);
      }
    } catch (err) {
      console.error("Failed to load assignment", err);
    }
  };

  const submittedStudentIds = new Set(submissions.map((s) => String(s.student_id)).filter(Boolean));
  const submittedNames = new Set(
    submissions
      .map((s) => s.name || "")
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean)
  );
  const nonSubmitted = students.filter((s) => {
    const studentId = String(s.id);
    const studentName = (s.name || "").trim().toLowerCase();
    return !submittedStudentIds.has(studentId) && !submittedNames.has(studentName);
  });

  if (loading) return <p style={{ padding: 24 }}>Loading submissions...</p>;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "linear-gradient(135deg,#8e7cc3,#6a4fb3)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          padding: "40px",
          boxSizing: "border-box",
          background: "#f4f1fa",
          borderRadius: "14px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0 }}>Assignment Submissions</h1>
            <p style={{ margin: "6px 0 0" }}>Review student submissions for this assignment.</p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              loadSubmissions();
              if (classId) loadStudents();
            }}
            style={{
              padding: "8px 14px",
              backgroundColor: "#7b5cd6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "12px",
            }}
          >
            Refresh
          </button>
        </div>

        {assignment && (
          <div style={{ marginTop: 18, marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#5a3fb4" }}>{assignment.title}</h2>
            <p style={{ margin: "6px 0 0", color: "#6c757d", fontSize: "14px" }}>
              Due: {new Date(assignment.due_date).toLocaleString()}
            </p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 12, color: "#5a3fb4" }}>
              Submitted ({submissions.length})
            </h3>
            {submissions.length === 0 ? (
              <p style={{ color: "#6c757d" }}>No submissions yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {submissions.map((sub, idx) => (
                  <div
                    key={sub.id}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: "#f7f4ff",
                      border: "1px solid rgba(108, 75, 191, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "#333" }}>
                        {idx + 1}. {sub.name}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>
                        Submitted on: {new Date(sub.submitted_at).toLocaleString()}
                      </div>
                    </div>
                    {sub.file_url && (
                      <a
                        href={`http://localhost:4000/uploads/${sub.file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "6px 10px",
                          background: "#7b5cd6",
                          color: "#fff",
                          borderRadius: "6px",
                          textDecoration: "none",
                          fontSize: "12px",
                        }}
                      >
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ marginTop: 0, marginBottom: 12, color: "#5a3fb4" }}>
              Not Submitted ({nonSubmitted.length})
            </h3>
            {nonSubmitted.length === 0 ? (
              <p style={{ color: "#6c757d" }}>All students have submitted.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {nonSubmitted.map((student, idx) => (
                  <div
                    key={student.id}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      background: "#fff",
                      border: "1px solid rgba(108, 75, 191, 0.15)",
                      color: "#333",
                      fontSize: "0.95rem",
                    }}
                  >
                    {idx + 1}. {student.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignmentSubmissionsPage;


