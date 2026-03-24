import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import usePopup from "../hooks/usePopup";
import { getUploadUrl } from "../uploadUrl";

function SubjectAnnouncementsPage() {
  const { id: classId, subjectId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [subjectInfo, setSubjectInfo] = useState(null);
  const [subjectAnnouncements, setSubjectAnnouncements] = useState([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementFile, setAnnouncementFile] = useState(null);
  const [Popup, showPopup] = usePopup();
  const announcementFileInputRef = useRef(null);

  useEffect(() => {
    loadClassDetails();
    loadSubjectDetails();
    loadSubjectAnnouncements();
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

  const loadSubjectAnnouncements = async () => {
    if (!subjectId) return;

    try {
      const res = await API.get(`/announcements/subject/${subjectId}`);
      setSubjectAnnouncements(res.data);
    } catch (err) {
      console.error("Load subject announcements failed", err);
    }
  };

  const createAnnouncement = async () => {
    if (!announcementTitle.trim()) {
      showPopup("Please enter announcement title");
      return;
    }
    if (!announcementContent.trim()) {
      showPopup("Please enter announcement content");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", announcementTitle);
      formData.append("content", announcementContent);
      formData.append("class_id", classId);
      formData.append("subject_id", subjectId);
      if (announcementFile) {
        formData.append("file", announcementFile);
      }

      await API.post("/announcements/create", formData, {
        headers: {
          'Content-Type': undefined,
        },
      });
      await loadSubjectAnnouncements();
      showPopup("Announcement posted successfully");
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setAnnouncementFile(null);
      if (announcementFileInputRef.current) {
        announcementFileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Create announcement failed", err);
      showPopup(err.response?.data?.message || "Unable to post announcement");
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

      await loadSubjectAnnouncements();
      showPopup("Meeting link posted successfully");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Meeting link creation failed", err);
      showPopup(err.response?.data?.message || "Unable to create meeting link");
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    const confirmed = window.confirm("Are you sure you want to delete this announcement?");
    if (!confirmed) return;

    try {
      await API.delete(`/announcements/delete/${announcementId}`);
      await loadSubjectAnnouncements();
      showPopup("Announcement deleted successfully");
    } catch (err) {
      console.error("Delete announcement failed", err);
      showPopup(err.response?.data?.message || "Unable to delete announcement");
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
            {classInfo ? classInfo.name : "Class"} - {subjectInfo ? subjectInfo.name : "Subject"} Announcements
          </h2>
        </div>

        <div style={{ display: "flex", gap: "15px", marginBottom: "30px" }}>
          <button
            onClick={() => navigate(`/teacher/class/${classId}/subject/${subjectId}/notes`)}
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
              backgroundColor: "#7b5cd6",
              color: "white",
              border: "none",
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
              Post Announcement
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                type="text"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="Announcement title"
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
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                placeholder="Announcement content"
                rows={6}
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
                ref={announcementFileInputRef}
                onChange={(e) => setAnnouncementFile(e.target.files[0])}
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
                onClick={createAnnouncement}
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
                Post Announcement
              </button>
            </div>
          </div>

          <div>
            <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#5a3fb4", fontSize: "18px" }}>
              Posted Announcements
            </h3>
            {subjectAnnouncements.length === 0 ? (
              <p style={{ color: "#6c757d", fontSize: "14px" }}>No announcements yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {subjectAnnouncements.map((a) => {
                  const isMeeting = a.title?.toLowerCase() === "meeting link" || a.content?.toLowerCase()?.includes("join meeting");
                  return (
                    <div
                      key={a.id}
                      style={{
                        minHeight: "110px",
                        padding: "20px",
                        marginBottom: "14px",
                        borderRadius: "10px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        backgroundColor: "#f7f4ff",
                        border: "2px solid #7b5cd6",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ fontSize: "16px", color: "#5a3fb4" }}>{a.title}</strong>
                      </div>
                      <div style={{ fontSize: "13px", marginBottom: "6px" }}>
                        Subject: <span style={{ fontWeight: 600 }}>{a.subject_name || "-"}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#6c757d", marginBottom: "6px" }}>
                        Posted: {new Date(a.created_at).toLocaleString()}
                      </div>
                      <div style={{ fontSize: "14px", color: "#495057", marginBottom: "6px" }}>
                        {linkify(a.content)}
                      </div>
                      {a.file && (
                        <a
                          href={getUploadUrl(a.file)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#7b5cd6", textDecoration: "none", fontSize: "14px" }}
                        >
                          Download Attachment
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteAnnouncement(a.id)}
                        style={{
                          marginTop: "8px",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid #dc3545",
                          backgroundColor: "#fff5f5",
                          color: "#dc3545",
                          fontWeight: 700,
                          cursor: "pointer",
                          alignSelf: "flex-start",
                        }}
                      >
                        Delete
                      </button>
                      {isMeeting && (
                        <button
                          style={{
                            marginTop: "8px",
                            padding: "6px 16px",
                            backgroundColor: "#7b5cd6",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: 600,
                            fontSize: "14px",
                            cursor: "pointer",
                            alignSelf: "flex-start",
                          }}
                          onClick={() => {
                            const urlMatch = a.content.match(/https?:\/\/\S+/);
                            if (urlMatch) window.open(urlMatch[0], "_blank");
                          }}
                        >
                          Join Meeting
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <Popup />
    </div>
  );
}

export default SubjectAnnouncementsPage;