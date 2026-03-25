import React from "react";
import { useNavigate } from "react-router-dom";
import { getUploadUrl } from "../uploadUrl";

function AssignmentWithToggle({
  assignment,
  classId,
  onDelete,
  onRequestDelete,
  onCancelDelete,
  isDeleteConfirming,
}) {
  const navigate = useNavigate();

  const handleToggle = () => {
    navigate(`/teacher/assignment/${assignment.id}/submissions`, { state: { classId } });
  };

  return (
    <div
      style={{
        paddingBottom: "12px",
        marginBottom: "12px",
        borderBottom: "1px solid #2d3a66",
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
        <span style={{ color: "#9ca8d3", fontSize: "12px" }}>
          Due: {new Date(assignment.due_date).toLocaleString()}
        </span>
      </div>
      <p style={{ margin: "6px 0", fontSize: "13px", color: "#b7c1e8" }}>
        {assignment.description}
      </p>
      {assignment.file && (
        <a
          href={getUploadUrl(assignment.file)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#ffffff",
            textDecoration: "none",
            fontSize: "12px",
          }}
        >
          Download: {assignment.file}
        </a>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px", gap: "8px" }}>
        {onDelete && !isDeleteConfirming && (
          <button
            onClick={() => (onRequestDelete ? onRequestDelete(assignment) : onDelete(assignment))}
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
        {onDelete && isDeleteConfirming && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <span style={{ fontSize: "12px", color: "#b02a37", fontWeight: 600 }}>
              Delete this assignment?
            </span>
            <button
              onClick={() => onDelete(assignment)}
              style={{
                padding: "6px 10px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "12px",
              }}
            >
              Yes, Delete
            </button>
            <button
              onClick={onCancelDelete}
              style={{
                padding: "6px 10px",
                backgroundColor: "#f8f9fa",
                color: "#b7c1e8",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "12px",
              }}
            >
              Cancel
            </button>
          </div>
        )}
        <button
          onClick={handleToggle}
          style={{
            padding: "6px 12px",
            background: "linear-gradient(135deg, #6d6cf7 0%, #915dff 100%)",
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
