import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import AssignmentWithToggle from "./AssignmentWithToggle";
import usePopup from "../hooks/usePopup";

function SubjectAssignmentsPage() {
  const { id: classId, subjectId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [subjectInfo, setSubjectInfo] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [pendingDeleteAssignmentId, setPendingDeleteAssignmentId] = useState(null);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [Popup, showPopup] = usePopup();
  const assignmentFileInputRef = useRef(null);
  const tomorrowMinDateTime = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T00:00`;
  })();

  useEffect(() => {
    loadClassDetails();
    loadSubjectDetails();
    loadAssignments();
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

  const loadAssignments = async () => {
    if (!subjectId) return;

    try {
      const res = await API.get(`/assignments/subject/${subjectId}`);
      // Show newest assignments first
      setAssignments(res.data.slice().sort((a, b) => b.id - a.id));
    } catch (err) {
      console.error("Load assignments failed", err);
    }
  };

  const createAssignment = async () => {
    if (!assignmentTitle.trim()) {
      showPopup("Please enter assignment title");
      return;
    }
    if (!assignmentDescription.trim()) {
      showPopup("Please enter assignment description");
      return;
    }
    if (!assignmentDueDate.trim()) {
      showPopup("Please select a due date and time");
      return;
    }
    const selectedDate = new Date(assignmentDueDate);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const selectedStart = new Date(selectedDate);
    selectedStart.setHours(0, 0, 0, 0);
    if (selectedStart <= todayStart) {
      showPopup("Due date must be after today");
      return;
    }
    if (!assignmentFile) {
      showPopup("Please attach a file for the assignment");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", assignmentTitle);
      formData.append("description", assignmentDescription);
      formData.append("due_date", assignmentDueDate);
      formData.append("subject_id", subjectId);
      formData.append("class_id", classId);
      formData.append("file", assignmentFile);

      await API.post("/assignments/create", formData, {
        headers: {
          'Content-Type': undefined,
        },
      });

      await loadAssignments();
      showPopup("Assignment uploaded successfully");

      setAssignmentTitle("");
      setAssignmentDescription("");
      setAssignmentDueDate("");
      setAssignmentFile(null);
      if (assignmentFileInputRef.current) {
        assignmentFileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Create assignment failed", err);
      showPopup(err.response?.data?.message || "Unable to upload assignment");
    }
  };

  const requestDeleteAssignment = (assignment) => {
    setPendingDeleteAssignmentId(assignment.id);
  };

  const deleteAssignment = async (assignment) => {
    try {
      await API.delete(`/assignments/delete/${assignment.id}`);
      setPendingDeleteAssignmentId(null);
      await loadAssignments();
      showPopup("Assignment deleted successfully");
    } catch (err) {
      console.error("Delete assignment failed", err);
      showPopup(err.response?.data?.message || "Unable to delete assignment");
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
            {classInfo ? classInfo.name : "Class"} - {subjectInfo ? subjectInfo.name : "Subject"} Assignments
          </h2>
        </div>

        <div style={{ display: "flex", gap: "15px", marginBottom: "30px" }}>
          <button
            onClick={() => navigate(`/teacher/class/${classId}/subject/${subjectId}/notes`)}
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
            Notes
          </button>
          <button
            onClick={() => navigate(`/teacher/class/${classId}/subject/${subjectId}/assignments`)}
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
              Create Assignment
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                type="text"
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
                placeholder="Assignment title"
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
                value={assignmentDescription}
                onChange={(e) => setAssignmentDescription(e.target.value)}
                placeholder="Assignment description"
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
              <input
                type="datetime-local"
                value={assignmentDueDate}
                onChange={(e) => setAssignmentDueDate(e.target.value)}
                min={tomorrowMinDateTime}
                aria-label="Assignment due date and time"
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
              <p style={{ margin: 0, color: "#c7ceff", fontSize: "12px", fontWeight: 600 }}>
                Assignment due date and time (today and past dates are not allowed)
              </p>
              <input
                type="file"
                ref={assignmentFileInputRef}
                onChange={(e) => setAssignmentFile(e.target.files[0])}
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
                onClick={createAssignment}
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
                Create Assignment
              </button>
            </div>
          </div>

          <div>
            <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#c7ceff", fontSize: "18px" }}>
              Assignments
            </h3>
            {assignments.length === 0 ? (
              <p style={{ color: "#9ca8d3", fontSize: "14px" }}>No assignments created yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {assignments.map((assignment) => (
                    <AssignmentWithToggle
                      key={assignment.id}
                      assignment={assignment}
                      classId={classId}
                      onRequestDelete={requestDeleteAssignment}
                      onDelete={deleteAssignment}
                      onCancelDelete={() => setPendingDeleteAssignmentId(null)}
                      isDeleteConfirming={pendingDeleteAssignmentId === assignment.id}
                    />
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

export default SubjectAssignmentsPage;