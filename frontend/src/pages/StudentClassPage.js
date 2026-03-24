import React, { useEffect, useState } from "react";
import usePopup from "../hooks/usePopup";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { getUploadUrl } from "../uploadUrl";

function StudentClassPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [subjectAnnouncements, setSubjectAnnouncements] = useState([]);
  const [classAnnouncements, setClassAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [submittedFiles, setSubmittedFiles] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showAllClassAnnouncements, setShowAllClassAnnouncements] = useState(false);
  const [showAllSubjectAnnouncements, setShowAllSubjectAnnouncements] = useState(false);
  const [Popup, showPopupMessage] = usePopup();

  useEffect(() => {
    const init = async () => {
      const subs = await loadSubjects();
      const submittedMap = await loadStudentSubmissions();
      loadClassNotifications(subs, submittedMap);
      await loadClassAnnouncements();
      await loadAllSubjectAnnouncements();
    };
    init();
  }, [id]);

  const loadSubjects = async () => {
    try {
      const res = await API.get(`/subjects/${id}`);
      setSubjects(res.data);
      return res.data;
    } catch (err) {
      console.error("Failed to load subjects", err);
      return [];
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
      return subs;
    } catch (err) {
      console.error("Failed to load student submissions", err);
      return {};
    }
  };

  const loadClassNotifications = async (subjectList, submittedLookup) => {
    const subjectsForLookup = subjectList || subjects;
    const submittedMap = submittedLookup || submittedFiles;
    try {
      const res = await API.get(`/assignments/class/${id}`);
      const now = new Date();
      let upcoming = res.data.filter((a) => {
        const due = new Date(a.due_date);
        const dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());
        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffDays = Math.round((dueDate - todayDate) / (1000 * 60 * 60 * 24));
        const notSubmitted = !submittedMap[a.id];
        let notExpired = diffDays >= 0;
        // If due today, check time
        if (diffDays === 0 && now > due) {
          notExpired = false;
        }
        // Show if due in 2 days, 1 day, or today, and not expired or submitted
        return (diffDays === 2 || diffDays === 1 || diffDays === 0) && notSubmitted && notExpired;
      });
      upcoming = upcoming.map((a) => {
        const subjId = a.subject_id != null ? Number(a.subject_id) : null;
        const subj =
          a.subject_name ||
          (subjId != null ? subjectsForLookup.find((s) => s.id === subjId)?.name : null) ||
          "No subject";
        return { ...a, subjName: subj };
      });
      upcoming.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
      setNotifications(upcoming);
      setShowPopup(upcoming.length > 0);
    } catch (err) {
      console.error("Failed to load class notifications", err);
    }
  };

  const loadClassAnnouncements = async () => {
    try {
      const res = await API.get(`/announcements/class/${id}`);
      setClassAnnouncements(res.data);
    } catch (err) {
      console.error("Failed to load class announcements", err);
    }
  };

  // Fetch all subject announcements for the class
  const loadAllSubjectAnnouncements = async () => {
    try {
      const res = await API.get(`/announcements/class/${id}`);
      // Only show announcements where subject_id is not null (subject announcements)
      const subjectAnnouncementsOnly = res.data.filter(a => a.subject_id != null);
      setSubjectAnnouncements(subjectAnnouncementsOnly);
    } catch (err) {
      console.error("Failed to load subject announcements", err);
      setSubjectAnnouncements([]);
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

  const handleExitClass = () => {
    setShowExitConfirm(true);
  };

  const confirmExitClass = async () => {
    setShowExitConfirm(false);
    try {
      await API.delete(`/classes/${id}/exit-student`);
      showPopupMessage("Successfully exited class");
      setTimeout(() => {
        navigate("/student");
      }, 2000);
    } catch (err) {
      console.error("Failed to exit class", err);
      showPopupMessage(err.response?.data?.message || "Failed to exit class");
    }
  };

  const cancelExitClass = () => {
    setShowExitConfirm(false);
  };

  const sortedSubjectAnnouncements = subjectAnnouncements
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const visibleSubjectAnnouncements = showAllSubjectAnnouncements
    ? sortedSubjectAnnouncements
    : sortedSubjectAnnouncements.slice(0, 3);
  const sortedClassAnnouncements = classAnnouncements
    .filter((a) => a.title !== "Meeting link")
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const visibleClassAnnouncements = showAllClassAnnouncements
    ? sortedClassAnnouncements
    : sortedClassAnnouncements.slice(0, 3);


  return (
    <div style={{ minHeight: "100vh", padding: 40, background: "#f5f7fb", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
      <div style={{ width: "100%", maxWidth: 1200, padding: 40, boxSizing: "border-box", background: "#f4f1fa", borderRadius: 14, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
        <header style={{ marginBottom: 24, display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
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
          <div style={{ textAlign: "center", flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 28, color: "#5a3fb4" }}>Class Dashboard</h1>
            <p style={{ margin: "8px 0 0", color: "#4b5563" }}>
              Select a subject to view notes and assignments.
            </p>
          </div>
          <button
            onClick={handleExitClass}
            style={{
              position: "absolute",
              right: 0,
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              transition: "background-color 0.3s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#c82333"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#dc3545"}
          >
            Exit Class
          </button>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 280px", gap: 24, alignItems: "start" }}>
          <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {showPopup && notifications.length > 0 && (
              <div style={{ position: "relative", backgroundColor: "#fff9c4", border: "1px solid #ebcc50", borderRadius: 12, padding: 16, color: "#4b5563" }}>
                <button
                  type="button"
                  onClick={() => setShowPopup(false)}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 16,
                    color: "#4b5563",
                  }}
                >
                  ×
                </button>
                <strong>Reminder:</strong> You have {notifications.length} assignment{notifications.length > 1 ? "s" : ""} due soon:
                <ul style={{ margin: "10px 0 0 20px", padding: 0, listStyleType: "disc" }}>
                  {notifications.map((assignment) => {
                    const due = new Date(assignment.due_date);
                    const now = new Date();
                    const dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const diffDays = Math.round((dueDate - todayDate) / (1000 * 60 * 60 * 24));
                    const subjName = assignment.subjName || "No subject";
                    let dueText = "";
                    if (diffDays === 0) dueText = "today";
                    else if (diffDays === 1) dueText = "1 day";
                    else if (diffDays === 2) dueText = "2 days";
                    return (
                      <li key={assignment.id} style={{ color: "#4b5563" }}>
                        [{subjName}] {assignment.title} – due {dueText} ({due.toLocaleString()})
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div style={{ backgroundColor: "#f3eefc", border: "1px solid #6c4bbf", borderRadius: 16, padding: 18 }}>
              <h2 style={{ marginTop: 0, marginBottom: 12, color: "#5a3fb4", paddingBottom: 6, borderBottom: "2px solid #6c4bbf" }}>Class Announcements</h2>
              {sortedClassAnnouncements.length === 0 ? (
                <p style={{ color: "#6b7280" }}>No class announcements</p>
              ) : (
                visibleClassAnnouncements.map((announcement) => (
                    <div key={announcement.id} style={{ marginBottom: 14, backgroundColor: "#ffffff", border: "1px solid rgba(108, 75, 191, 0.25)", borderRadius: 12, padding: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                      <h4 style={{ margin: 0 }}>{announcement.title}</h4>
                      <p className="text-muted" style={{ margin: "6px 0", color: "#4b5563" }}>
                        Posted: {new Date(announcement.created_at).toLocaleString()}
                      </p>
                      <p style={{ margin: 0 }}>{linkify(announcement.content)}</p>
                      {announcement.file && (
                        <a className="button button--secondary" href={getUploadUrl(announcement.file)} target="_blank" rel="noopener noreferrer" style={{ marginTop: 10, display: "inline-flex" }}>
                          Download Attachment
                        </a>
                      )}
                    </div>
                  ))
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
          </aside>

          <main style={{ backgroundColor: "#f3eefc", border: "1px solid #d2c5f4", borderRadius: 12, padding: 18 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ marginTop: 0, marginBottom: 12, color: "#5a3fb4", paddingBottom: 6, borderBottom: "2px solid #6c4bbf" }}>Subjects</h2>
              {subjects.length === 0 ? (
                <p>No subjects found for this class.</p>
              ) : (
                subjects.map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    style={{
                      width: "100%",
                      marginBottom: 12,
                      justifyContent: "flex-start",
                      padding: "16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      backgroundColor: "#ffffff",
                      cursor: "pointer",
                      textAlign: "left",
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
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                    onClick={() => {
                      navigate(`/student/class/${id}/subject/${subject.id}`);
                    }}
                  >
                    <div style={{ fontSize: "20px", fontWeight: 600, color: "#111827", marginBottom: 8 }}>
                      {subject.name}
                    </div>
                  </button>
                ))
              )}
            </div>
          </main>

          <aside style={{ backgroundColor: "#f3eefc", border: "1px solid #6c4bbf", borderRadius: 16, padding: 18, minHeight: 480 }}>
            <h2 style={{ marginTop: 0, marginBottom: 12, color: "#5a3fb4", paddingBottom: 6, borderBottom: "2px solid #6c4bbf" }}>Subject Announcements</h2>
            {sortedSubjectAnnouncements.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No announcements</p>
            ) : (
              visibleSubjectAnnouncements.map((announcement) => {
                let subjectName = "Unknown Subject";
                if (announcement.subject_id != null && subjects.length > 0) {
                  const subj = subjects.find((s) => s.id === announcement.subject_id);
                  subjectName = subj ? subj.name : subjectName;
                }
                if (announcement.title === "Meeting link") {
                  const urlMatch = announcement.content.match(/https?:\/\/\S+/);
                  const url = urlMatch ? urlMatch[0] : null;
                  return (
                    <div
                      key={announcement.id}
                      style={{
                        marginBottom: 14,
                        backgroundColor: "#ffffff",
                        border: "1px solid rgba(108, 75, 191, 0.25)",
                        borderRadius: 12,
                        padding: 14,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      }}
                    >
                      <h4 style={{ margin: 0, color: "#5a3fb4" }}>Meeting link</h4>
                      <p className="text-muted" style={{ margin: "1px 0", color: "#4b5563", fontSize: "0.85rem" }}>
                        Subject: <strong>{subjectName}</strong>
                        <br />
                        Posted: {new Date(announcement.created_at).toLocaleString()}
                      </p>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-block",
                            padding: "8px 14px",
                            backgroundColor: "#6c4bbf",
                            color: "#fff",
                            border: "1px solid #6c4bbf",
                            borderRadius: "4px",
                            fontWeight: 600,
                            textDecoration: "none",
                            marginBottom: "2px",
                            fontSize: "0.85rem",
                          }}
                        >
                          Join Meeting
                        </a>
                      ) : (
                        <p style={{ margin: 0 }}>{linkify(announcement.content)}</p>
                      )}
                    </div>
                  );
                }
                return (
                  <div
                    key={announcement.id}
                    style={{
                      marginBottom: 12,
                      backgroundColor: "#ffffff",
                      border: "1px solid rgba(108, 75, 191, 0.25)",
                      borderRadius: 12,
                      padding: 14,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}
                  >
                    <h4 style={{ margin: 0 }}>{announcement.title}</h4>
                    <p className="text-muted" style={{ margin: "6px 0", color: "#4b5563" }}>
                      Subject: <strong>{subjectName}</strong>
                      <br />
                      Posted: {new Date(announcement.created_at).toLocaleString()}
                    </p>
                    <p style={{ margin: 0 }}>{linkify(announcement.content)}</p>
                    {announcement.file && (
                      <a
                        className="button button--secondary"
                        href={getUploadUrl(announcement.file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginTop: 10, display: "inline-flex" }}
                      >
                        Download Attachment
                      </a>
                    )}
                  </div>
                );
              })
            )}
            {sortedSubjectAnnouncements.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllSubjectAnnouncements((prev) => !prev)}
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
                {showAllSubjectAnnouncements ? "Hide all" : "Show all"}
              </button>
            )}
          </aside>
        </div>

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
                Are you sure you want to exit this class? Your submissions will be deleted.
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
                  Exit
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

export default StudentClassPage;

