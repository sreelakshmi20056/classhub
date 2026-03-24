import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import usePopup from "../hooks/usePopup";
import API from "../api";
import { getUploadUrl } from "../uploadUrl";

export default function CoordinatorClassPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [audience, setAudience] = useState("students");
  const [announcementFile, setAnnouncementFile] = useState(null);
  const [showTeachers, setShowTeachers] = useState(true);
  const [showSubjects, setShowSubjects] = useState(true);
  const [showStudents, setShowStudents] = useState(true);
  const [showAnnouncements, setShowAnnouncements] = useState(true);
  const [Popup, showPopup] = usePopup();
  const announcementFileInputRef = React.useRef(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 800 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 800);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  useEffect(() => {
    loadClassDetails();
    loadAnnouncements();
  }, [id]);

  const loadClassDetails = async () => {
    try {
      const res = await API.get(`/classes/${id}/details`);
      setClassInfo(res.data.classInfo);
      setTeachers(res.data.teachers);
      const sortedStudents = res.data.students.slice().sort((a, b) =>
        a.name?.localeCompare?.(b.name || "") ?? 0
      );
      setStudents(sortedStudents);
      setSubjects(res.data.subjects);
    } catch (err) {
      console.error("Failed to load class details", err);
      showPopup(err.response?.data?.message || "Failed to load class details");
    }
  };

  const loadAnnouncements = async () => {
    try {
      const res = await API.get(`/announcements/class/${id}`);
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Failed to load announcements", err);
      showPopup(err.response?.data?.message || "Failed to load announcements");
    }
  };

  const postAnnouncement = async () => {
    if (!announcementTitle.trim()) {
      showPopup("Please enter a title");
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
      formData.append("class_id", id);
      formData.append("audience", audience);
      if (announcementFile) {
        formData.append("file", announcementFile);
      }

      await API.post("/announcements/create", formData, {
        headers: {
          'Content-Type': undefined,
        },
      });

      setAnnouncementTitle("");
      setAnnouncementContent("");
      setAudience("students");
      setAnnouncementFile(null);
      if (announcementFileInputRef.current) {
        announcementFileInputRef.current.value = "";
      }
      await loadAnnouncements();
      showPopup("Announcement posted successfully");
    } catch (err) {
      console.error("Failed to post announcement", err);
      showPopup(err.response?.data?.message || "Failed to post announcement");
    }
  };

  const renderTeachers = () => {
    if (teachers.length === 0) {
      return <p style={{ color: "#6c757d" }}>No teachers assigned yet.</p>;
    }

    const subjectsByTeacher = teachers.reduce((acc, teacher) => {
      acc[teacher.id] = { ...teacher, subjects: [] };
      return acc;
    }, {});

    subjects.forEach((subj) => {
      if (subj.teacher_id && subjectsByTeacher[subj.teacher_id]) {
        subjectsByTeacher[subj.teacher_id].subjects.push(subj.name);
      }
    });

    return Object.values(subjectsByTeacher).map((t) => (
      <div
        key={t.id}
        style={{
          padding: "16px",
          backgroundColor: "#E8F3FF",
          borderRadius: "8px",
          border: "1px solid #b8d4ff",
          marginBottom: "12px",
        }}
      >
        <strong style={{ display: "block", marginBottom: "4px" }}>{t.name}</strong>
        <span style={{ color: "#495057", fontSize: "14px" }}>
          Subjects: {t.subjects.length ? t.subjects.join(", ") : "None"}
        </span>
      </div>
    ));
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      background: "#fffff0",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isMobile ? "16px" : "32px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "1200px",
        background: "#fff",
        borderRadius: "18px",
        boxShadow: "0 8px 32px rgba(124,92,191,0.12)",
        padding: isMobile ? "18px" : "40px",
        border: "2px solid #d1c4e9",
      }}>
        <div
          style={{
            position: "relative",
            marginBottom: "32px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => navigate("/")}
            style={{
              position: "absolute",
              left: 0,
              padding: "8px 12px",
              backgroundColor: "transparent",
              border: "2px solid #7b5cd6",
              borderRadius: "6px",
              cursor: "pointer",
              color: "#7b5cd6",
              transition: "all 0.3s",
              minWidth: "45px",
              height: "45px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Go to Login"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#7b5cd6";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#7b5cd6";
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>

          <h2 style={{
            textAlign: "center",
            color: "#7c5cbf",
            margin: 0,
            fontSize: isMobile ? "26px" : "36px",
            fontWeight: "700",
            letterSpacing: "1px",
          }}>
            {classInfo ? classInfo.name : "Class"} Details
          </h2>
        </div>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "32px" : "60px",
        }}>
          {/* LEFT CONTAINER */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{
              padding: isMobile ? "12px" : "18px",
              borderRadius: "12px",
              border: "1px solid #d1c4e9",
              background: "#f3f0fa",
              marginBottom: "20px",
            }}>
              <h3 style={{ marginTop: 0, marginBottom: "10px", fontSize: "18px", fontWeight: 700, color: "#7c5cbf" }}>
                Class Info
              </h3>
              <p style={{ margin: "6px 0", fontSize: "15px", color: "#555" }}>
                <strong>Name:</strong> {classInfo?.name || "-"}
              </p>
              <p style={{ margin: "6px 0", fontSize: "15px", color: "#555" }}>
                <strong>Join Code:</strong> {classInfo?.join_code || "-"}
              </p>
            </div>
            <div style={{
              paddingBottom: "8px",
              marginBottom: "20px",
              borderBottom: "3px solid #7c5cbf",
            }}>
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#7c5cbf",
                }}
                onClick={() => setShowTeachers(!showTeachers)}
              >
                Teachers & Subjects {showTeachers ? "▼" : "▶"}
              </h3>
              {showTeachers && (teachers.length === 0 ? (
                <p style={{ color: "#b8b8b8" }}>No teachers assigned yet.</p>
              ) : (
                Object.values(teachers.reduce((acc, teacher) => {
                  acc[teacher.id] = { ...teacher, subjects: [] };
                  return acc;
                }, {})).map(t => {
                  const teacherSubjects = subjects.filter((subj) => subj.teacher_id === t.id);
                  return (
                    <div
                      key={t.id}
                      style={{
                        padding: "12px",
                        background: "#ede7f6",
                        borderRadius: "8px",
                        border: "1px solid #d1c4e9",
                        marginBottom: "8px",
                      }}
                    >
                      <strong style={{ display: "block", marginBottom: "4px", color: "#7c5cbf" }}>{t.name}</strong>
                      <span style={{ color: "#555", fontSize: "14px" }}>
                        Subjects: {teacherSubjects.length ? teacherSubjects.map(s => s.name).join(", ") : "None"}
                      </span>
                    </div>
                  );
                })
              ))}
            </div>
            <div style={{
              paddingBottom: "8px",
              marginBottom: "20px",
            }}>
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#7c5cbf",
                  borderBottom: "3px solid #6a4fb3",
                  paddingBottom: "12px",
                }}
                onClick={() => setShowStudents(!showStudents)}
              >
                Students {showStudents ? "▼" : "▶"}
              </h3>
              {showStudents && (students.length === 0 ? (
                <p style={{ color: "#b8b8b8" }}>No students joined yet.</p>
              ) : (
                students.map((s, index) => (
                  <div
                    key={s.id}
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid #d1c4e9",
                      marginBottom: "8px",
                      background: "#f3f0fa",
                      color: "#555",
                    }}
                  >
                    {index + 1}. {s.name}
                  </div>
                ))
              ))}
            </div>
          </div>
          {/* RIGHT CONTAINER */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{
              padding: isMobile ? "8px" : "16px",
              borderRadius: "12px",
              border: "1px solid #d1c4e9",
              background: "#f3f0fa",
              marginBottom: "20px",
            }}>
              <h3 style={{ marginTop: 0, marginBottom: "8px", fontSize: "18px", fontWeight: 700, color: "#7c5cbf" }}>
                Post Announcement
              </h3>
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", marginBottom: "3px", fontWeight: 600, fontSize: "13px", color: "#7c5cbf" }}>
                  Title <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="Announcement title"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "2px solid #d1c4e9",
                    fontSize: "15px",
                    background: "#fff",
                  }}
                />
              </div>
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", marginBottom: "3px", fontWeight: 600, fontSize: "13px", color: "#7c5cbf" }}>
                  Content <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <textarea
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "2px solid #d1c4e9",
                    resize: "vertical",
                    fontSize: "15px",
                    background: "#fff",
                  }}
                />
              </div>
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", marginBottom: "3px", fontWeight: 600, fontSize: "13px", color: "#7c5cbf" }}>
                  Audience <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "2px solid #d1c4e9",
                    fontSize: "15px",
                    background: "#fff",
                  }}
                >
                  <option value="students">Students</option>
                  <option value="teachers">Teachers</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", marginBottom: "3px", fontWeight: 600, fontSize: "13px", color: "#7c5cbf" }}>
                  Attach File (Optional)
                </label>
                <input
                  type="file"
                  ref={announcementFileInputRef}
                  onChange={(e) => setAnnouncementFile(e.target.files[0])}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "8px",
                    border: "2px solid #d1c4e9",
                    fontSize: "14px",
                    background: "#fff",
                  }}
                />
              </div>
              <button
                onClick={postAnnouncement}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#7c5cbf",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "16px",
                  marginTop: "8px",
                  transition: "background 0.3s",
                }}
                onMouseEnter={e => e.target.style.background = "#6a4fb3"}
                onMouseLeave={e => e.target.style.background = "#7c5cbf"}
              >
                Post Announcement
              </button>
            </div>
            <div style={{
              paddingBottom: "16px",
              marginBottom: "40px",
              borderBottom: "3px solid #d1c4e9",
            }}>
              <h3
                style={{ marginTop: 0, marginBottom: "16px", cursor: "pointer", display: "flex", alignItems: "center", fontSize: "20px", fontWeight: 700, color: "#7c5cbf" }}
                onClick={() => setShowAnnouncements(!showAnnouncements)}
              >
                Posted Announcements {showAnnouncements ? "▼" : "▶"}
              </h3>
              {showAnnouncements && (announcements.filter((a) => !a.subject_id).length === 0 ? (
                <p style={{ color: "#b8b8b8" }}>No announcements yet.</p>
              ) : (
                announcements
                  .filter((a) => !a.subject_id)
                  .map((a) => (
                    <div
                      key={a.id}
                      style={{
                        marginBottom: "16px",
                        paddingBottom: "12px",
                        borderBottom: "1px solid #d1c4e9",
                        background: "#ede7f6",
                        borderRadius: "8px",
                        padding: "12px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong style={{ color: "#7c5cbf" }}>{a.title}</strong>
                        <span style={{ color: "#888", fontSize: "14px" }}>
                          {new Date(a.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ margin: "8px 0", color: "#555" }}>{linkify(a.content)}</p>
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <span style={{ color: "#888", fontSize: "13px" }}>
                          Audience: {a.audience ? a.audience.charAt(0).toUpperCase() + a.audience.slice(1) : "N/A"}
                        </span>
                        {a.file && (
                          <a
                            href={getUploadUrl(a.file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#7c5cbf",
                              textDecoration: "none",
                              fontSize: "13px",
                            }}
                          >
                            Download: {a.file}
                          </a>
                        )}
                      </div>
                    </div>
                  ))
              ))}
            </div>
          </div>
        </div>
        <Popup />
      </div>
    </div>
  );
}
