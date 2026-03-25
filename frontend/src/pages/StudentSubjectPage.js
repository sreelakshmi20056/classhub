import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api";
import usePopup from "../hooks/usePopup";
import { getUploadUrl } from "../uploadUrl";

function StudentSubjectPage() {
  const { id: classId, subjectId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [subjectInfo, setSubjectInfo] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [files, setFiles] = useState({});
  const [submittedFiles, setSubmittedFiles] = useState({});
  const [inputKeys, setInputKeys] = useState({});
  const [activeTab, setActiveTab] = useState("notes");
  const [Popup, showPopup] = usePopup();

  useEffect(() => {
    loadClassDetails();
    loadSubjectDetails();
    loadAssignments();
    loadNotes();
    loadStudentSubmissions();
  }, [classId, subjectId]);

  const loadClassDetails = async () => {
    try {
      const res = await API.get(`/classes/${classId}/details`);
      setClassInfo(res.data.classInfo);
    } catch (err) {
      console.error("Failed to load class details", err);
    }
  };

  const loadSubjectDetails = async () => {
    try {
      const res = await API.get(`/classes/${classId}/subjects`);
      const subject = res.data.find((s) => s.id === Number(subjectId));
      setSubjectInfo(subject);
    } catch (err) {
      console.error("Failed to load subject details", err);
    }
  };

  const loadAssignments = async () => {
    if (!subjectId) return;
    try {
      const res = await API.get(`/assignments/subject/${subjectId}`);
      setAssignments(res.data.slice().sort((a, b) => b.id - a.id));
    } catch (err) {
      console.error("Failed to load assignments", err);
    }
  };

  const loadNotes = async () => {
    if (!subjectId) return;
    try {
      const res = await API.get(`/notes/subject/${subjectId}`);
      setNotes(res.data);
    } catch (err) {
      console.error("Load notes failed", err);
    }
  };

  const loadStudentSubmissions = async () => {
    try {
      const res = await API.get("/submissions/student");
      const subs = {};
      res.data.forEach((sub) => {
        subs[sub.assignment_id] = sub.file_url;
      });
      setSubmittedFiles(subs);
    } catch (err) {
      console.error("Failed to load student submissions", err);
    }
  };

  const submit = async (assignmentId) => {
    let fileToSubmit = files[assignmentId];
    if (!fileToSubmit) {
      const inputElem = document.querySelector(`input[type='file'][data-assignment-id='${assignmentId}']`);
      if (inputElem && inputElem.files && inputElem.files[0]) {
        fileToSubmit = inputElem.files[0];
      }
    }
    if (!fileToSubmit) {
      showPopup("Please select a file to submit");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", fileToSubmit);
      formData.append("assignment_id", assignmentId);

      const response = await API.post("/submissions/submit", formData);
      const newFiles = { ...files };
      delete newFiles[assignmentId];
      setFiles(newFiles);
      setSubmittedFiles({ ...submittedFiles, [assignmentId]: response.data.file_url });
      setInputKeys({ ...inputKeys, [assignmentId]: (inputKeys[assignmentId] || 0) + 1 });

      showPopup("Submitted successfully");
      loadAssignments();
      loadStudentSubmissions();
    } catch (err) {
      console.error("Submit failed", err);
      showPopup(err.response?.data?.message || "Unable to submit");
    }
  };

  const isExpired = (dueDate) => {
    const due = new Date(dueDate);
    return new Date() > due;
  };

  const linkify = (text) => {
    if (!text || typeof text !== "string") return text;
    const urlRegex = /https?:\/\/\S+/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(
        <a
          key={match.index}
          href={match[0]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#ffffff" }}
        >
          {match[0]}
        </a>
      );
      lastIndex = urlRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  };

  const highlightButton = (active) =>
    active ? "button button--primary" : "button button--secondary";

  return (
    <div style={{ minHeight: "100vh", padding: 40, background: "radial-gradient(circle at 18% 16%, rgba(99, 82, 235, 0.2) 0%, rgba(99, 82, 235, 0) 42%), radial-gradient(circle at 82% 20%, rgba(202, 92, 255, 0.2) 0%, rgba(202, 92, 255, 0) 34%), linear-gradient(130deg, #0b1333 0%, #11193d 56%, #1a1740 100%)", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
      <div style={{ width: "100%", maxWidth: 1200, padding: 40, boxSizing: "border-box", background: "rgba(10, 18, 43, 0.78)", borderRadius: 14, boxShadow: "0 26px 56px rgba(3, 8, 28, 0.56)", border: "1px solid #253261", backdropFilter: "blur(10px)" }}>
        <div style={{ marginBottom: "30px", display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            onClick={() => navigate(`/student/class/${classId}`)}
            style={{
              padding: "8px 16px",
              background: "linear-gradient(135deg, #6d6cf7 0%, #915dff 100%)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            ← Back to Class
          </button>
          <h2
            style={{
              margin: 0,
              color: "#d7deff",
              fontWeight: "700",
              letterSpacing: "1px",
            }}
          >
            {classInfo ? classInfo.name : "Class"} - {subjectInfo ? subjectInfo.name : "Subject"}
          </h2>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button
            type="button"
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #2d3a66",
              backgroundColor: activeTab === "notes" ? "#6c4bbf" : "#101a3c",
              color: activeTab === "notes" ? "#fff" : "#c7ceff",
              cursor: "pointer",
            }}
            onClick={() => setActiveTab("notes")}
          >
            Notes
          </button>
          <button
            type="button"
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #2d3a66",
              backgroundColor: activeTab === "assignments" ? "#6c4bbf" : "#101a3c",
              color: activeTab === "assignments" ? "#fff" : "#c7ceff",
              cursor: "pointer",
            }}
            onClick={() => setActiveTab("assignments")}
          >
            Assignments
          </button>
        </div>

        {activeTab === "notes" && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 12, color: "#c7ceff" }}>Notes</h3>
            {notes.length === 0 ? (
              <p style={{ color: "#9ca8d3" }}>No notes</p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    marginBottom: 12,
                    backgroundColor: "#101a3c",
                    border: "1px solid #2d3a66",
                    borderRadius: 10,
                    padding: 14,
                  }}
                >
                  <h4 style={{ margin: "0 0 8px 0", color: "#c7ceff" }}>{note.title}</h4>
                  <p style={{ margin: "0 0 10px 0", color: "#b7c1e8" }}>{note.description}</p>
                  {note.file && (
                    <a
                      className="button button--secondary"
                      href={getUploadUrl(note.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#ffffff" }}
                    >
                      Download Note
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "assignments" && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 12, color: "#c7ceff" }}>Assignments</h3>
            {assignments.length === 0 ? (
              <p style={{ color: "#9ca8d3" }}>No assignments</p>
            ) : (
              assignments.map((assignment) => {
                const expired = isExpired(assignment.due_date);
                return (
                  <div
                    key={assignment.id}
                    style={{
                      marginBottom: 12,
                      backgroundColor: "#101a3c",
                      border: "1px solid #2d3a66",
                      borderRadius: 10,
                      padding: 14,
                    }}
                  >
                    <h4 style={{ margin: "0 0 8px 0", color: "#c7ceff" }}>
                      <Link
                        to={`/student/assignment/${assignment.id}/submissions`}
                        style={{ textDecoration: "none", color: "#c7ceff" }}
                      >
                        {assignment.title}
                      </Link>
                    </h4>
                    <p style={{ margin: "0 0 8px 0", color: "#b7c1e8" }}>{assignment.description}</p>
                    <p className="text-muted" style={{ margin: 0, fontSize: "0.9rem", color: "#9ca8d3" }}>
                      Due: {new Date(assignment.due_date).toLocaleString()}
                    </p>
                    {assignment.file && (
                      <a
                        className="button button--secondary"
                        href={getUploadUrl(assignment.file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginTop: 10, display: "inline-flex", color: "#ffffff" }}
                      >
                        Download Assignment
                      </a>
                    )}

                    {submittedFiles[assignment.id] ? (
                      <div style={{ marginTop: 12 }}>
                        <span style={{ fontWeight: 600, color: '#388e3c' }}>Submitted</span>
                        <a
                          className="button button--primary"
                          href={getUploadUrl(submittedFiles[assignment.id])}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginLeft: 12, display: "inline-flex" }}
                        >
                          View Submission
                        </a>
                      </div>
                    ) : expired ? (
                      <p style={{ marginTop: 12, fontWeight: 600, color: "#d32f2f" }}>
                        Assignment expired
                      </p>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          submit(assignment.id);
                        }}
                        className="form"
                        style={{ marginTop: 12, alignItems: "flex-start" }}
                      >
                        <input
                          key={inputKeys[assignment.id] || 0}
                          type="file"
                          name="file"
                          data-assignment-id={assignment.id}
                          onChange={(e) => setFiles({ ...files, [assignment.id]: e.target.files[0] })}
                          className="input"
                          disabled={!!submittedFiles[assignment.id]}
                        />
                        <button className="button button--primary" type="submit" disabled={!!submittedFiles[assignment.id]}>
                          Submit
                        </button>
                      </form>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        <Popup />
      </div>
    </div>
  );
}

export default StudentSubjectPage;