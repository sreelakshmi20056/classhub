import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import usePopup from "../hooks/usePopup";
import { getUploadUrl } from "../uploadUrl";

function StudentSubjectAssignmentsPage() {
  const { id: classId, subjectId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [subjectInfo, setSubjectInfo] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [files, setFiles] = useState({});
  const [submittedFiles, setSubmittedFiles] = useState({});
  const [inputKeys, setInputKeys] = useState({});
  const [Popup, showPopup] = usePopup();

  useEffect(() => {
    loadClassDetails();
    loadSubjectDetails();
    loadAssignments();
    loadStudentSubmissions();
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

  const loadAssignments = async () => {
    if (!subjectId) return;
    try {
      const res = await API.get(`/assignments/subject/${subjectId}`);
      setAssignments(res.data.slice().sort((a, b) => b.id - a.id));
    } catch (err) {
      console.error("Failed to load assignments", err);
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
    } catch (err) {
      console.error("Failed to load student submissions", err);
    }
  };

  const submit = async (assignmentId) => {
    let fileToSubmit = files[assignmentId];
    if (!fileToSubmit) {
      const inputElem = document.querySelector(`input[type='file'][data-assignment-id='${assignmentId}']`);
      if (inputElem && inputElem.files && inputElem.files[0]) {
        fileToSubmit = inputElem.files[0];
      }
    }
    if (!fileToSubmit) {
      showPopup("Please select a file to submit");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", fileToSubmit);
      formData.append("assignment_id", assignmentId);

      const response = await API.post("/submissions/submit", formData);
      const newFiles = { ...files };
      delete newFiles[assignmentId];
      setFiles(newFiles);
      setSubmittedFiles({ ...submittedFiles, [assignmentId]: response.data.file_url });
      setInputKeys({ ...inputKeys, [assignmentId]: (inputKeys[assignmentId] || 0) + 1 });

      showPopup("Submitted successfully");
      loadAssignments();
      loadStudentSubmissions();
    } catch (err) {
      console.error("Submit failed", err);
      showPopup(err.response?.data?.message || "Unable to submit");
    }
  };

  const isExpired = (dueDate) => {
    const due = new Date(dueDate);
    return new Date() > due;
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
            {classInfo ? classInfo.name : "Class"} - {subjectInfo ? subjectInfo.name : "Subject"} Assignments
          </h2>
        </div>

        <div style={{ display: "grid", gap: "20px" }}>
          {assignments.length === 0 ? (
            <p style={{ color: "#9ca8d3" }}>No assignments yet.</p>
          ) : (
            assignments.map((assignment) => {
              const expired = isExpired(assignment.due_date);
              return (
                <div
                  key={assignment.id}
                  style={{
                    borderRadius: 12,
                    background: "#101a3c",
                    border: "1px solid #2d3a66",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    padding: 18,
                  }}
                >
                  <h4 style={{ margin: "0 0 8px 0", color: "#c7ceff" }}>{assignment.title}</h4>
                  <p style={{ margin: "0 0 8px 0", color: "#b7c1e8" }}>{assignment.description}</p>
                  <p style={{ margin: 0, color: "#9ca8d3", fontSize: "0.9rem" }}>
                    Due: {new Date(assignment.due_date).toLocaleString()}
                  </p>

                  {assignment.file && (
                    <a
                      className="button button--secondary"
                      href={getUploadUrl(assignment.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginTop: 10, display: "inline-flex", color: "#ffffff" }}
                    >
                      Download Assignment
                    </a>
                  )}

                  {submittedFiles[assignment.id] ? (
                    <div style={{ marginTop: 12 }}>
                      <span style={{ fontWeight: 600, color: "#388e3c" }}>Submitted</span>
                      <a
                        className="button button--primary"
                        href={getUploadUrl(submittedFiles[assignment.id])}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: 12, display: "inline-flex" }}
                      >
                        View Submission
                      </a>
                    </div>
                  ) : expired ? (
                    <p style={{ marginTop: 12, fontWeight: 600, color: "#d32f2f" }}>
                      Assignment expired
                    </p>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        submit(assignment.id);
                      }}
                      className="form"
                      style={{ marginTop: 12, alignItems: "flex-start" }}
                    >
                      <input
                        key={inputKeys[assignment.id] || 0}
                        type="file"
                        name="file"
                        data-assignment-id={assignment.id}
                        onChange={(e) => setFiles({ ...files, [assignment.id]: e.target.files[0] })}
                        className="input"
                        style={{
                          color: "#c7ceff",
                          backgroundColor: "#101a3c",
                          border: "1px solid #2d3a66",
                          borderRadius: "6px",
                          padding: "6px",
                        }}
                        disabled={!!submittedFiles[assignment.id]}
                      />
                      <button className="button button--primary" type="submit" disabled={!!submittedFiles[assignment.id]}>
                        Submit
                      </button>
                    </form>
                  )}
                </div>
              );
            })
          )}
        </div>

        <Popup />
      </div>
    </div>
  );
}

export default StudentSubjectAssignmentsPage;
