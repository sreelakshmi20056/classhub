import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import usePopup from "../hooks/usePopup";
import { getUploadUrl } from "../uploadUrl";

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

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "radial-gradient(circle at 18% 16%, rgba(99, 82, 235, 0.2) 0%, rgba(99, 82, 235, 0) 42%), radial-gradient(circle at 82% 20%, rgba(202, 92, 255, 0.2) 0%, rgba(202, 92, 255, 0) 34%), linear-gradient(130deg, #0b1333 0%, #11193d 56%, #1a1740 100%)",
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
          background: "rgba(10, 18, 43, 0.78)",
          borderRadius: "14px",
          boxShadow: "0 26px 56px rgba(3, 8, 28, 0.56)",
          border: "1px solid #253261",
          backdropFilter: "blur(10px)",
        }}
      >
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
            {classInfo ? classInfo.name : "Class"} - {subjectInfo ? subjectInfo.name : "Subject"} Notes
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
          <div style={{ background: "#131f49", border: "1px solid #2d3a66", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h3 style={{ marginTop: 0, color: "#c7ceff" }}>Existing Notes</h3>
            {notes.length === 0 ? (
              <p style={{ color: "#9ca8d3" }}>No notes yet.</p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    marginBottom: 12,
                    padding: 14,
                    borderRadius: 12,
                    background: "#101a3c",
                    border: "1px solid #2d3a66",
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
        </div>

        <Popup />
      </div>
    </div>
  );
}

export default StudentSubjectNotesPage;
