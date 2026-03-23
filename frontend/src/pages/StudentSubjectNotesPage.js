import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import usePopup from "../hooks/usePopup";

function StudentSubjectNotesPage() {
  const { id: classId, subjectId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [subjectInfo, setSubjectInfo] = useState(null);
  const [notes, setNotes] = useState([]);
  const [Popup, showPopup] = usePopup();

  useEffect(() => {
    loadClassDetails();
    loadSubjectDetails();
    loadNotes();
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

  const loadNotes = async () => {
    if (!subjectId) return;

    try {
      const res = await API.get(`/notes/subject/${subjectId}`);
      setNotes(res.data);
    } catch (err) {
      console.error("Load notes failed", err);
    }
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
        <a key={match.index} href={match[0]} target="_blank" rel="noopener noreferrer">
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

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "#ffffff",
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
        <div style={{ marginBottom: "30px", display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            onClick={() => navigate(`/student/class/${classId}`)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#7b5cd6",
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
              color: "#6a4fb3",
              fontWeight: "700",
              letterSpacing: "1px",
            }}
          >
            {classInfo ? classInfo.name : "Class"} - {subjectInfo ? subjectInfo.name : "Subject"} Notes
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h3 style={{ marginTop: 0, color: "#5a3fb4" }}>Existing Notes</h3>
            {notes.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No notes yet.</p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    marginBottom: 12,
                    padding: 14,
                    borderRadius: 12,
                    background: "#f7f4ff",
                    border: "1px solid rgba(108, 75, 191, 0.25)",
                  }}
                >
                  <h4 style={{ margin: "0 0 8px 0" }}>{note.title}</h4>
                  <p style={{ margin: "0 0 10px 0", color: "#4b5563" }}>{note.description}</p>
                  {note.file && (
                    <a
                      className="button button--secondary"
                      href={`http://localhost:4000/uploads/${note.file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download Note
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <Popup />
      </div>
    </div>
  );
}

export default StudentSubjectNotesPage;
