import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import usePopup from "../hooks/usePopup";

function SubjectNotesPage() {
  const { id: classId, subjectId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [subjectInfo, setSubjectInfo] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");
  const [noteFile, setNoteFile] = useState(null);
  const [Popup, showPopup] = usePopup();
  const noteFileInputRef = useRef(null);

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
      const subject = res.data.find(s => s.id === parseInt(subjectId));
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

  const createNote = async () => {
    if (!noteTitle.trim()) {
      showPopup("Please enter note title");
      return;
    }
    if (!noteFile) {
      showPopup("Please attach a file for the note");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", noteTitle);
      formData.append("description", noteDescription);
      formData.append("subject_id", subjectId);
      formData.append("class_id", classId);
      formData.append("file", noteFile);

      await API.post("/notes/create", formData, {
        headers: {
          'Content-Type': undefined,
        },
      });

      await loadNotes();
      showPopup("Note uploaded successfully");

      setNoteTitle("");
      setNoteDescription("");
      setNoteFile(null);
      if (noteFileInputRef.current) {
        noteFileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Create note failed", err);
      showPopup(err.response?.data?.message || "Unable to upload note");
    }
  };

  const createMeetLink = async () => {
    try {
      const res = await API.post(`/classes/${classId}/meet`);
      const url = res.data.url;

      // Post the meeting link as a subject announcement so students and teachers can see it
      const formData = new FormData();
      formData.append("title", "Meeting link");
      formData.append("content", `Join meeting: ${url}`);
      formData.append("class_id", classId);
      formData.append("subject_id", subjectId);

      await API.post("/announcements/create", formData, {
        headers: {
          "Content-Type": undefined,
        },
      });

      showPopup("Meeting link posted successfully");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Meeting link creation failed", err);
      showPopup(err.response?.data?.message || "Unable to create meeting link");
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
    <div style={{
      minHeight: "100vh",
      padding: "40px",
      background: "#ffffff",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start"
    }}>
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          padding: "40px",
          boxSizing: "border-box",
          background: "#f4f1fa",
          borderRadius: "14px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
        }}
      >
        <div style={{ marginBottom: "30px", display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            onClick={() => navigate(`/teacher/class/${classId}`)}
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
          <h2 style={{
            margin: 0,
            color: "#6a4fb3",
            fontWeight: "700",
            letterSpacing: "1px"
          }}>
            {classInfo ? classInfo.name : "Class"} - {subjectInfo ? subjectInfo.name : "Subject"} Notes
          </h2>
        </div>

        <div style={{ display: "flex", gap: "15px", marginBottom: "30px" }}>
          <button
            onClick={() => navigate(`/teacher/class/${classId}/subject/${subjectId}/notes`)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#7b5cd6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Notes
          </button>
          <button
            onClick={() => navigate(`/teacher/class/${classId}/subject/${subjectId}/assignments`)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#f7f4ff",
              color: "#5a3fb4",
              border: "1px solid #cbbaf0",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Assignments
          </button>
          <button
            onClick={() => navigate(`/teacher/class/${classId}/subject/${subjectId}/announcements`)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#f7f4ff",
              color: "#5a3fb4",
              border: "1px solid #cbbaf0",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Announcements
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "30px" }}>
          <div>
            {/* MEETING SECTION */}
            <div style={{ marginBottom: "30px" }}>
              <div
                style={{
                  paddingBottom: "16px",
                  borderBottom: "3px solid #7b5cd6",
                  marginBottom: "20px",
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: "15px",
                    color: "#333",
                    fontSize: "18px",
                    fontWeight: 700,
                  }}
                >
                  Meeting
                </h3>
                <button
                  onClick={createMeetLink}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#7b5cd6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  Create & Post Meeting Link
                </button>
              </div>
            </div>

            <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#5a3fb4", fontSize: "18px" }}>
              Upload Note
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title"
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #cbbaf0",
                  backgroundColor: "#f7f4ff",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              <textarea
                value={noteDescription}
                onChange={(e) => setNoteDescription(e.target.value)}
                placeholder="Note description (optional)"
                rows={4}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #cbbaf0",
                  backgroundColor: "#f7f4ff",
                  fontSize: "14px",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
              <input
                type="file"
                ref={noteFileInputRef}
                onChange={(e) => setNoteFile(e.target.files[0])}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #cbbaf0",
                  backgroundColor: "#f7f4ff",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={createNote}
                style={{
                  padding: "10px",
                  backgroundColor: "#7b5cd6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Upload Note
              </button>
            </div>
          </div>

          <div>
            <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#5a3fb4", fontSize: "18px" }}>
              Uploaded Notes
            </h3>
            {notes.length === 0 ? (
              <p style={{ color: "#6c757d", fontSize: "14px" }}>No notes uploaded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: "20px",
                      borderRadius: "10px",
                      backgroundColor: "#f7f4ff",
                      border: "2px solid #7b5cd6",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ marginBottom: "10px" }}>
                      <strong style={{ fontSize: "16px", color: "#5a3fb4" }}>{note.title}</strong>
                    </div>
                    {note.description && (
                      <div style={{ fontSize: "14px", marginBottom: "10px", color: "#495057" }}>
                        {linkify(note.description)}
                      </div>
                    )}
                    <div style={{ fontSize: "12px", color: "#6c757d", marginBottom: "10px" }}>
                      Uploaded: {new Date(note.created_at).toLocaleString()}
                    </div>
                    <a
                      href={`http://localhost:4000/uploads/${note.file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#7b5cd6",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      Download Note
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Popup />
    </div>
  );
}

export default SubjectNotesPage;