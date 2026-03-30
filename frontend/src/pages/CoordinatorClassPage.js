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
  const [pendingDeleteAnnouncementId, setPendingDeleteAnnouncementId] = useState(null);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [audience, setAudience] = useState("students");
  const [meetingAudience, setMeetingAudience] = useState("both");
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
        <a
          key={match.index}
          href={match[0]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#8f7cff", textDecoration: "underline" }}
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

  const createAndPostMeetingLink = async () => {
    try {
      const meetRes = await API.post(`/classes/${id}/meet`);
      const url = String(meetRes?.data?.url || "").trim();
      if (!url) {
        showPopup("Failed to create meeting link");
        return;
      }

      const formData = new FormData();
      formData.append("title", "Meeting link");
      formData.append("content", `Join meeting: ${url}`);
      formData.append("class_id", id);
      formData.append("audience", meetingAudience);

      await API.post("/announcements/create", formData, {
        headers: {
          "Content-Type": undefined,
        },
      });

      await loadAnnouncements();
      showPopup("Meeting link posted successfully");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to create meeting link", err);
      showPopup(err.response?.data?.message || "Failed to create meeting link");
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    try {
      await API.delete(`/announcements/delete/${announcementId}`);
      setPendingDeleteAnnouncementId(null);
      await loadAnnouncements();
      showPopup("Announcement deleted successfully");
    } catch (err) {
      console.error("Failed to delete announcement", err);
      showPopup(err.response?.data?.message || "Failed to delete announcement");
    }
  };

  const renderTeachers = () => {
    if (teachers.length === 0) {
      return <p style={{ color: "#9ca8d3" }}>No teachers assigned yet.</p>;
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
          backgroundColor: "#131f49",
          borderRadius: "8px",
          border: "1px solid #2d3a66",
          marginBottom: "12px",
        }}
      >
        <strong style={{ display: "block", marginBottom: "4px", color: "#d7deff" }}>{t.name}</strong>
        <span style={{ color: "#b7c1e8", fontSize: "14px" }}>
          Subjects: {t.subjects.length ? t.subjects.join(", ") : "None"}
        </span>
      </div>
    ));
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      background: "radial-gradient(circle at 18% 16%, rgba(99, 82, 235, 0.2) 0%, rgba(99, 82, 235, 0) 42%), radial-gradient(circle at 82% 20%, rgba(202, 92, 255, 0.2) 0%, rgba(202, 92, 255, 0) 34%), linear-gradient(130deg, #0b1333 0%, #11193d 56%, #1a1740 100%)",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isMobile ? "16px" : "32px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "1200px",
        background: "rgba(10, 18, 43, 0.78)",
        borderRadius: "18px",
        boxShadow: "0 26px 56px rgba(3, 8, 28, 0.56)",
        padding: isMobile ? "18px" : "40px",
        border: "1px solid #253261",
        backdropFilter: "blur(10px)",
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
              backgroundColor: "#121e47",
              border: "1px solid #2d3a66",
              borderRadius: "6px",
              cursor: "pointer",
              color: "#8f7cff",
              transition: "all 0.3s",
              minWidth: "45px",
              height: "45px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Go to Login"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#8f7cff";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#121e47";
              e.currentTarget.style.color = "#8f7cff";
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>

          <h2 style={{
            textAlign: "center",
            color: "#d7deff",
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
              border: "1px solid #2d3a66",
              background: "#131f49",
              marginBottom: "20px",
            }}>
              <h3 style={{ marginTop: 0, marginBottom: "10px", fontSize: "18px", fontWeight: 700, color: "#c7ceff" }}>
                Class Info
              </h3>
              <p style={{ margin: "6px 0", fontSize: "15px", color: "#b7c1e8" }}>
                <strong>Name:</strong> {classInfo?.name || "-"}
              </p>
              <p style={{ margin: "6px 0", fontSize: "15px", color: "#b7c1e8" }}>
                <strong>Join Code:</strong> {classInfo?.join_code || "-"}
              </p>
            </div>
            <div style={{
              paddingBottom: "8px",
              marginBottom: "20px",
              borderBottom: "2px solid #2d3a66",
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
                  color: "#c7ceff",
                }}
                onClick={() => setShowTeachers(!showTeachers)}
              >
                Teachers & Subjects {showTeachers ? "▼" : "▶"}
              </h3>
              {showTeachers && (teachers.length === 0 ? (
                <p style={{ color: "#9ca8d3" }}>No teachers assigned yet.</p>
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
                        background: "#131f49",
                        borderRadius: "8px",
                        border: "1px solid #2d3a66",
                        marginBottom: "8px",
                      }}
                    >
                      <strong style={{ display: "block", marginBottom: "4px", color: "#d7deff" }}>{t.name}</strong>
                      <span style={{ color: "#b7c1e8", fontSize: "14px" }}>
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
                  color: "#c7ceff",
                  borderBottom: "2px solid #2d3a66",
                  paddingBottom: "12px",
                }}
                onClick={() => setShowStudents(!showStudents)}
              >
                Students {showStudents ? "▼" : "▶"}
              </h3>
              {showStudents && (students.length === 0 ? (
                <p style={{ color: "#9ca8d3" }}>No students joined yet.</p>
              ) : (
                students.map((s, index) => (
                  <div
                    key={s.id}
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid #2d3a66",
                      marginBottom: "8px",
                      background: "#131f49",
                      color: "#b7c1e8",
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
              border: "1px solid #2d3a66",
              background: "#131f49",
              marginBottom: "20px",
            }}>
              <h3 style={{ marginTop: 0, marginBottom: "8px", fontSize: "18px", fontWeight: 700, color: "#c7ceff" }}>
                Post Announcement
              </h3>
              <div style={{
                marginBottom: "12px",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #2d3a66",
                background: "#101a3c",
              }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#bfc7ed" }}>
                  Meeting audience <span style={{ color: "#ff6f97" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <select
                    value={meetingAudience}
                    onChange={(e) => setMeetingAudience(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: "140px",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "2px solid #2d3a66",
                      fontSize: "14px",
                      background: "#0f1839",
                      color: "#eef2ff",
                    }}
                  >
                    <option value="students">Students</option>
                    <option value="teachers">Teachers</option>
                    <option value="both">Both</option>
                  </select>
                  <button
                    type="button"
                    onClick={createAndPostMeetingLink}
                    style={{
                      padding: "10px 12px",
                      background: "linear-gradient(135deg, #3a8dff 0%, #6d6cf7 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "13px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Create & Post Meeting Link
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", marginBottom: "3px", fontWeight: 600, fontSize: "13px", color: "#bfc7ed" }}>
                  Title <span style={{ color: "#ff6f97" }}>*</span>
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
                    border: "2px solid #2d3a66",
                    fontSize: "15px",
                    background: "#101a3c",
                    color: "#eef2ff",
                  }}
                />
              </div>
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", marginBottom: "3px", fontWeight: 600, fontSize: "13px", color: "#bfc7ed" }}>
                  Content <span style={{ color: "#ff6f97" }}>*</span>
                </label>
                <textarea
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "2px solid #2d3a66",
                    resize: "vertical",
                    fontSize: "15px",
                    background: "#101a3c",
                    color: "#eef2ff",
                  }}
                />
              </div>
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", marginBottom: "3px", fontWeight: 600, fontSize: "13px", color: "#bfc7ed" }}>
                  Audience <span style={{ color: "#ff6f97" }}>*</span>
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "2px solid #2d3a66",
                    fontSize: "15px",
                    background: "#101a3c",
                    color: "#eef2ff",
                  }}
                >
                  <option value="students">Students</option>
                  <option value="teachers">Teachers</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", marginBottom: "3px", fontWeight: 600, fontSize: "13px", color: "#bfc7ed" }}>
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
                    border: "2px solid #2d3a66",
                    fontSize: "14px",
                    background: "#101a3c",
                    color: "#eef2ff",
                  }}
                />
              </div>
              <button
                onClick={postAnnouncement}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "linear-gradient(135deg, #6d6cf7 0%, #915dff 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "16px",
                  marginTop: "8px",
                  transition: "background 0.3s",
                  boxShadow: "0 10px 28px rgba(123, 104, 255, 0.4)",
                }}
                onMouseEnter={e => e.target.style.background = "linear-gradient(135deg, #5f5fee 0%, #8649ff 100%)"}
                onMouseLeave={e => e.target.style.background = "linear-gradient(135deg, #6d6cf7 0%, #915dff 100%)"}
              >
                Post Announcement
              </button>
            </div>
            <div style={{
              paddingBottom: "16px",
              marginBottom: "40px",
              borderBottom: "2px solid #2d3a66",
            }}>
              <h3
                style={{ marginTop: 0, marginBottom: "16px", cursor: "pointer", display: "flex", alignItems: "center", fontSize: "20px", fontWeight: 700, color: "#c7ceff" }}
                onClick={() => setShowAnnouncements(!showAnnouncements)}
              >
                Posted Announcements {showAnnouncements ? "▼" : "▶"}
              </h3>
              {showAnnouncements && (announcements.filter((a) => !a.subject_id).length === 0 ? (
                <p style={{ color: "#9ca8d3" }}>No announcements yet.</p>
              ) : (
                announcements
                  .filter((a) => !a.subject_id)
                  .map((a) => (
                    <div
                      key={a.id}
                      style={{
                        marginBottom: "16px",
                        paddingBottom: "12px",
                        borderBottom: "1px solid #2d3a66",
                        background: "#131f49",
                        borderRadius: "8px",
                        padding: "12px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong style={{ color: "#d7deff" }}>{a.title}</strong>
                        <span style={{ color: "#8e98be", fontSize: "14px" }}>
                          {new Date(a.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ margin: "8px 0", color: "#b7c1e8" }}>{linkify(a.content)}</p>
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <span style={{ color: "#8e98be", fontSize: "13px" }}>
                          Audience: {a.audience ? a.audience.charAt(0).toUpperCase() + a.audience.slice(1) : "N/A"}
                        </span>
                        {a.file && (
                          <a
                            href={getUploadUrl(a.file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#ffffff",
                              textDecoration: "none",
                              fontSize: "13px",
                            }}
                          >
                            Download: {a.file}
                          </a>
                        )}
                        {pendingDeleteAnnouncementId === a.id ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "12px", color: "#b02a37", fontWeight: 600 }}>
                              Delete this announcement?
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteAnnouncement(a.id)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: "#dc3545",
                                color: "white",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Yes, Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteAnnouncementId(null)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: "1px solid #2d3a66",
                                backgroundColor: "#121e47",
                                color: "#d7deff",
                                fontSize: "13px",
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
                            onClick={() => setPendingDeleteAnnouncementId(a.id)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              border: "1px solid #dc3545",
                              backgroundColor: "rgba(220, 53, 69, 0.12)",
                              color: "#ff9cac",
                              fontSize: "13px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
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
