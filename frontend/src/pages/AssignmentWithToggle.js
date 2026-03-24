import React from "react";
import { useNavigate } from "react-router-dom";
import { getUploadUrl } from "../uploadUrl";

function AssignmentWithToggle({ assignment, classId, onDelete }) {
  const navigate = useNavigate();

  const handleToggle = () => {
    navigate(`/teacher/assignment/${assignment.id}/submissions`, { state: { classId } });
  };

  return (
    <div
      style={{
        paddingBottom: "12px",
        marginBottom: "12px",
        borderBottom: "1px solid #e9ecef",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <strong style={{ fontSize: "13px", color: "#333" }}>{assignment.title}</strong>
        <span style={{ color: "#6c757d", fontSize: "12px" }}>
          Due: {new Date(assignment.due_date).toLocaleString()}
        </span>
      </div>
      <p style={{ margin: "6px 0", fontSize: "13px", color: "#495057" }}>
        {assignment.description}
      </p>
      {assignment.file && (
        <a
          href={getUploadUrl(assignment.file)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#007bff",
            textDecoration: "none",
            fontSize: "12px",
          }}
        >
          Download: {assignment.file}
        </a>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px", gap: "8px" }}>
        {onDelete && (
          <button
            onClick={() => onDelete(assignment)}
            style={{
              padding: "6px 12px",
              backgroundColor: "#fff5f5",
              color: "#dc3545",
              border: "1px solid #dc3545",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "12px",
            }}
          >
            Delete
          </button>
        )}
        <button
          onClick={handleToggle}
          style={{
            padding: "6px 12px",
            backgroundColor: "#7b5cd6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "12px",
          }}
        >
          Show Submissions
        </button>
      </div>
    </div>
  );
}

export default AssignmentWithToggle;
