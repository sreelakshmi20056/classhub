import React, { useEffect, useState } from "react";
import usePopup from "../hooks/usePopup";
import { Link } from "react-router-dom";
import API from "../api";

function Student() {
  const [classes, setClasses] = useState([]);
  const [joinCode, setJoinCode] = useState("");
  const [Popup, showPopup] = usePopup();

  const formatClassExpiry = (value) => {
    if (!value) return "Not set";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not set";
    return parsed.toLocaleString();
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res = await API.get("/classes/joined");
      setClasses(res.data);
    } catch (err) {
      console.error("Failed to load joined classes", err);
    }
  };

  const joinClass = async () => {
    if (!joinCode.trim()) {
      showPopup("Please enter a class code");
      return;
    }
    try {
      await API.post("/classes/join", { join_code: joinCode });
      loadClasses();
      showPopup("Successfully joined the class!");
      setJoinCode("");
    } catch (err) {
      console.error("Failed to join class", err);
      showPopup(err.response?.data?.message || "Failed to join class");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          border: "1px solid #e6e8ec",
          padding: "30px",
        }}
      >
        <Popup />
        <h2
          style={{
            textAlign: "center",
            color: "#111827",
            letterSpacing: "0.5px",
            marginBottom: "40px",
            fontSize: "32px",
            fontWeight: "700",
          }}
        >
          My Classes
        </h2>

        <div
          style={{
            marginBottom: "40px",
            backgroundColor: "#f9fafb",
            padding: "30px",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              marginBottom: "20px",
              color: "#111827",
              letterSpacing: "0.5px",
              fontSize: "24px",
              fontWeight: "600",
            }}
          >
            Join a Class
          </h3>
          <div
            style={{
              display: "flex",
              gap: "15px",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="Enter class code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              disabled={classes.length > 0}
              style={{
                flex: 1,
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "16px",
                transition: "border-color 0.3s",
                outline: "none",
                backgroundColor: "#ffffff",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
            <button
              onClick={joinClass}
              disabled={classes.length > 0}
              style={{
                padding: "12px 24px",
                backgroundColor: classes.length > 0 ? "#9ca3af" : "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: classes.length > 0 ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "600",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => !classes.length && (e.target.style.backgroundColor = "#1d4ed8")}
              onMouseLeave={(e) => !classes.length && (e.target.style.backgroundColor = "#2563eb")}
            >
              Join Class
            </button>
          </div>
          {classes.length > 0 && (
            <p
              style={{
                marginTop: "15px",
                fontSize: "14px",
                color: "#5a4fa0",
              }}
            >
              You are already a member of a class, so you cannot join another one.
            </p>
          )}
        </div>

        <h3
          style={{
            marginBottom: "20px",
            color: "#111827",
            letterSpacing: "0.5px",
            fontSize: "24px",
            fontWeight: "600",
          }}
        >
          Joined Classes
        </h3>
        {classes.length === 0 ? (
            <p
              style={{
                color: "#6b7280",
                fontStyle: "italic",
                textAlign: "center",
                padding: "40px",
                fontSize: "18px",
              }}
          >
            No classes joined yet. Use a class code to join one above.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "20px",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            }}
          >
            {classes.map((cls) => (
              <Link
                key={cls.id}
                to={`/student/class/${cls.id}`}
                style={{
                  padding: "20px",
                  backgroundColor: "#ffffff",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid #e5e7eb",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  display: "block",
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
              >
                <h4
                  style={{
                    margin: "0 0 10px 0",
                    color: "#111827",
                    letterSpacing: "0.5px",
                    fontSize: "20px",
                    fontWeight: "600",
                  }}
                >
                  {cls.name}
                </h4>
                <p
                  style={{
                    margin: "0",
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  Click to view class
                </p>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#4b5563",
                    fontSize: "13px",
                  }}
                >
                  Class expires: {formatClassExpiry(cls.expires_at)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Student;


