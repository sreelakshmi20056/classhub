import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import usePopup from "../hooks/usePopup";
import { getUploadUrl } from "../uploadUrl";

function TeacherClassPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showAllClassAnnouncements, setShowAllClassAnnouncements] = useState(false);
  const [Popup, showPopup] = usePopup();

  useEffect(() => {
    loadClassDetails();
    loadSubjects();
    loadClassAnnouncements();
    loadStudents();
  }, [id]);

  const loadClassDetails = async () => {
    try {
      const res = await API.get(`/classes/${id}/details`);
      setClassInfo(res.data.classInfo);
    } catch (err) {
      console.error("Failed to load class details", err);
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await API.get(`/classes/${id}/subjects`);
      setSubjects(res.data);
    } catch (err) {
      console.error("Load subjects failed", err);
    }
  };

  const loadClassAnnouncements = async () => {
    try {
      const res = await API.get(`/announcements/class/${id}`);
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Load class announcements failed", err);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await API.get(`/classes/${id}/students`);
      const sorted = res.data.slice().sort((a, b) =>
        a.name?.localeCompare?.(b.name || "") ?? 0
      );
      setStudents(sorted);
    } catch (err) {
      console.error("Load students failed", err);
    }
  };

  const createSubject = async () => {
    if (!subjectName.trim()) {
      showPopup("Please enter a subject name");
      return;
    }

    try {
      await API.post(`/classes/${id}/subjects`, { name: subjectName, class_id: id });
      await loadSubjects();
      setSubjectName("");
      showPopup("Subject created successfully!");
    } catch (err) {
      console.error("Create subject failed", err);
      showPopup(err.response?.data?.message || "Unable to create subject");
    }
  };

  const handleSubjectClick = (subjectId) => {
    navigate(`/teacher/class/${id}/subject/${subjectId}/notes`);
  };

  const handleExitClass = () => {
    setShowExitConfirm(true);
  };

  const confirmExitClass = async () => {
    setShowExitConfirm(false);
    try {
      await API.delete(`/classes/${id}/exit`);
      showPopup("Successfully exited class");
      setTimeout(() => {
        navigate("/teacher");
      }, 2000);
    } catch (err) {
      console.error("Failed to exit class", err);
      showPopup(err.response?.data?.message || "Failed to exit class");
    }
  };

  const cancelExitClass = () => {
    setShowExitConfirm(false);
  };

  const sortedClassAnnouncements = announcements
    .filter((a) => !a.subject_id)
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const visibleClassAnnouncements = showAllClassAnnouncements
    ? sortedClassAnnouncements
    : sortedClassAnnouncements.slice(0, 3);

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
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          position: "relative"
        }}
      >
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px"
        }}>
          <button
            onClick={() => navigate("/teacher")}
            style={{
              padding: "8px 12px",
              backgroundColor: "transparent",
              border: "2px solid #7b5cd6",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "18px",
              fontWeight: "600",
              color: "#7b5cd6",
              transition: "all 0.3s",
              whiteSpace: "nowrap",
              minWidth: "45px",
              height: "45px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Go to Teacher Home"
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#7b5cd6";
              e.target.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#7b5cd6";
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <h2 style={{
              margin: 0,
              color: "#6a4fb3",
              fontWeight: "700",
              letterSpacing: "1px"
            }}>
              {classInfo ? classInfo.name : "Class"} Management
            </h2>
            <p style={{
              margin: "8px 0 0",
              color: "#4f6078",
              fontSize: "15px",
              fontWeight: 500
            }}>
              Select a subject to manage notes, assignments, and announcements.
            </p>
          </div>
          <button
            onClick={handleExitClass}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              transition: "background-color 0.3s",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#c82333"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#dc3545"}
          >
            Exit Class
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr 280px",
            gap: "30px",
          }}
        >
          {/* LEFT COLUMN - CLASS ANNOUNCEMENTS */}
          <div>
            <div>
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
                    color: "#5a3fb4",
                    fontSize: "18px",
                    fontWeight: 700,
                  }}
                >
                  Class Announcements
                </h3>
              </div>

              {sortedClassAnnouncements.length === 0 ? (
                <p style={{ color: "#6c757d", fontSize: "13px" }}>No class announcements yet.</p>
              ) : (
                <div>
                  {visibleClassAnnouncements.map((a) => (
                      <div
                        key={a.id}
                        style={{
                          paddingBottom: "12px",
                          marginBottom: "12px",
                          borderBottom: "1px solid #e9ecef",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <strong style={{ fontSize: "13px", color: "#5a3fb4" }}>{a.title}</strong>
                          <span style={{ color: "#6c757d", fontSize: "12px" }}>
                            {new Date(a.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p style={{ margin: "6px 0", fontSize: "13px", color: "#495057" }}>
                          {a.content}
                        </p>
                        {a.file && (
                          <a
                            href={getUploadUrl(a.file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#007bff",
                              textDecoration: "none",
                              fontSize: "12px",
                            }}
                          >
                            Download: {a.file}
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              )}
              {sortedClassAnnouncements.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllClassAnnouncements((prev) => !prev)}
                  style={{
                    marginTop: 4,
                    padding: "8px 12px",
                    backgroundColor: "#6c4bbf",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  {showAllClassAnnouncements ? "Hide all" : "Show all"}
                </button>
              )}
            </div>
          </div>

          {/* MIDDLE COLUMN - SUBJECTS */}
          <div>
            <div style={{ marginBottom: "30px" }}>
              <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#5a3fb4", fontSize: "18px" }}>
                Subjects
              </h3>
              <div style={{ marginBottom: "15px" }}>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="Subject name"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #cbbaf0",
                    backgroundColor: "#f7f4ff",
                    marginBottom: "8px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={createSubject}
                  style={{
                    width: "100%",
                    padding: "8px",
                    backgroundColor: "#7b5cd6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Create Subject
                </button>
              </div>

              <div style={{ marginTop: "12px" }}>
                <h4 style={{ margin: 0, marginBottom: "8px", fontSize: "14px", color: "#5a3fb4" }}>
                  Created Subjects
                </h4>
                {subjects.length === 0 ? (
                  <p style={{ color: "#6c757d", fontSize: "13px" }}>No subjects created yet.</p>
                ) : (
                  <div style={{ display: "grid", gap: "8px" }}>
                    {subjects.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          backgroundColor: "#ffffff",
                          color: "#5a3fb4",
                          border: "1px solid #cbbaf0",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: 500,
                          transition: "all 0.3s ease",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#ffffff";
                          e.currentTarget.style.borderColor = "#2563eb";
                          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#ffffff";
                          e.currentTarget.style.borderColor = "#cbbaf0";
                          e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                        onClick={() => handleSubjectClick(s.id)}
                      >
                        {s.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - STUDENTS */}
          <div>
            <div>
              <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#5a3fb4", fontSize: "18px" }}>
                Students
              </h3>
              <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                {students.length === 0 ? (
                  <p style={{ color: "#6c757d", fontSize: "13px" }}>No students joined yet.</p>
                ) : (
                  students.map((s, index) => (
                    <div
                      key={s.id}
                      style={{
                        padding: "10px",
                        marginBottom: "8px",
                        backgroundColor: "#e9e4f6",
                        border: "1px solid #d5c9f3",
                        borderRadius: "10px",
                        borderLeft: "3px solid #7b5cd6",
                        fontSize: "13px",
                        color: "#5a3fb4"
                      }}
                    >
                      {index + 1}. {s.name}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Exit Class Confirmation Dialog */}
        {showExitConfirm && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                maxWidth: "400px",
                width: "90%",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "20px",
                  color: "#6a4fb3",
                  fontSize: "20px",
                  fontWeight: "700",
                }}
              >
                Confirm Exit Class
              </h3>
              <p
                style={{
                  marginBottom: "30px",
                  color: "#495057",
                  fontSize: "16px",
                  lineHeight: "1.5",
                }}
              >
                Are you sure you want to exit this class? Your subjects and their content will be deleted.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={cancelExitClass}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "background-color 0.3s",
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = "#5a6268")}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "#6c757d")}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmExitClass}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "background-color 0.3s",
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = "#c82333")}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "#dc3545")}
                >
                  Exit Class
                </button>
              </div>
            </div>
          </div>
        )}

        <Popup />
      </div>
    </div>
  );
}

export default TeacherClassPage;