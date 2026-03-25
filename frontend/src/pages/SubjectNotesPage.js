import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import usePopup from "../hooks/usePopup";
import { getUploadUrl } from "../uploadUrl";

function SubjectNotesPage() {
  const { id: classId, subjectId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [subjectInfo, setSubjectInfo] = useState(null);
  const [notes, setNotes] = useState([]);
  const [pendingDeleteNoteId, setPendingDeleteNoteId] = useState(null);
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

  const deleteNote = async (noteId) => {
    try {
      await API.delete(`/notes/delete/${noteId}`);
      setPendingDeleteNoteId(null);
      await loadNotes();
      showPopup("Note deleted successfully");
    } catch (err) {
      console.error("Delete note failed", err);
      showPopup(err.response?.data?.message || "Unable to delete note");
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
      background: "radial-gradient(circle at 18% 16%, rgba(99, 82, 235, 0.2) 0%, rgba(99, 82, 235, 0) 42%), radial-gradient(circle at 82% 20%, rgba(202, 92, 255, 0.2) 0%, rgba(202, 92, 255, 0) 34%), linear-gradient(130deg, #0b1333 0%, #11193d 56%, #1a1740 100%)",
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
          background: "rgba(10, 18, 43, 0.78)",
          borderRadius: "14px",
          
        }}
      >
        <div style={{ marginBottom: "30px", display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            onClick={() => navigate(`/teacher/class/${classId}`)}
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
          <h2 style={{
            margin: 0,
            color: "#d7deff",
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
              background: "linear-gradient(135deg, #6d6cf7 0%, #915dff 100%)",
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
              backgroundColor: "#101a3c",
              color: "#c7ceff",
              border: "1px solid #2d3a66",
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
              backgroundColor: "#101a3c",
              color: "#c7ceff",
              border: "1px solid #2d3a66",
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
                  borderBottom: "2px solid #2d3a66",
                  marginBottom: "20px",
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: "15px",
                    color: "#c7ceff",
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
                    background: "linear-gradient(135deg, #6d6cf7 0%, #915dff 100%)",
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

            <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#c7ceff", fontSize: "18px" }}>
              Upload Note
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ margin: 0, color: "#c7ceff", fontSize: "12px", fontWeight: 600 }}>
                Note title <span style={{ color: "#ff6b6b" }}>*</span>
              </p>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title"
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #2d3a66",
                  backgroundColor: "#101a3c",
                  color: "#c7ceff",
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
                  border: "1px solid #2d3a66",
                  backgroundColor: "#101a3c",
                  color: "#c7ceff",
                  fontSize: "14px",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
              <p style={{ margin: 0, color: "#c7ceff", fontSize: "12px", fontWeight: 600 }}>
                Note file <span style={{ color: "#ff6b6b" }}>*</span>
              </p>
              <input
                type="file"
                ref={noteFileInputRef}
                onChange={(e) => setNoteFile(e.target.files[0])}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #2d3a66",
                  backgroundColor: "#101a3c",
                  color: "#c7ceff",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={createNote}
                style={{
                  padding: "10px",
                  background: "linear-gradient(135deg, #6d6cf7 0%, #915dff 100%)",
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
            <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#c7ceff", fontSize: "18px" }}>
              Uploaded Notes
            </h3>
            {notes.length === 0 ? (
              <p style={{ color: "#9ca8d3", fontSize: "14px" }}>No notes uploaded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: "20px",
                      borderRadius: "10px",
                      backgroundColor: "#101a3c",
                      border: "1px solid #2d3a66",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ marginBottom: "10px" }}>
                      <strong style={{ fontSize: "16px", color: "#c7ceff" }}>{note.title}</strong>
                    </div>
                    {note.description && (
                      <div style={{ fontSize: "14px", marginBottom: "10px", color: "#b7c1e8" }}>
                        {linkify(note.description)}
                      </div>
                    )}
                    <div style={{ fontSize: "12px", color: "#9ca8d3", marginBottom: "10px" }}>
                      Uploaded: {new Date(note.created_at).toLocaleString()}
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <a
                        href={getUploadUrl(note.file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#8f7cff",
                          textDecoration: "none",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        Download Note
                      </a>
                      {pendingDeleteNoteId === note.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "12px", color: "#b02a37", fontWeight: 600 }}>
                            Delete this note?
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteNote(note.id)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              border: "none",
                              backgroundColor: "#dc3545",
                              color: "white",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Yes, Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteNoteId(null)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              border: "1px solid #ced4da",
                              backgroundColor: "#f8f9fa",
                              color: "#b7c1e8",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPendingDeleteNoteId(note.id)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #dc3545",
                            backgroundColor: "#fff5f5",
                            color: "#dc3545",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
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