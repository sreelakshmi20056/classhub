import React, { useEffect, useState } from "react";
import usePopup from "../hooks/usePopup";
import API from "../api";
import { Link, useNavigate } from "react-router-dom";

function Teacher() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [code, setCode] = useState("");
  const [Popup, showPopup] = usePopup();

  const formatClassExpiry = (value) => {
    if (!value) return "Not set";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not set";
    return parsed.toLocaleString();
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await API.get("/classes/joined");
      setClasses(res.data);
    } catch (err) {
      console.error("Failed to load classes", err);
    }
  };

  const joinClass = async () => {
    if (!code.trim()) {
      showPopup("Please enter a class code");
      return;
    }
    try {
      await API.post("/classes/join", { join_code: code });
      setCode("");
      fetchClasses();
    } catch (err) {
      console.error("Join class failed", err);
      showPopup(err.response?.data?.message || "Unable to join class");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "ffffff",
        padding: "40px 20px",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          background: "#f4f1fa",
          borderRadius: "18px",
          padding: "40px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        }}
      >
        <Popup />

        <div
          style={{
            position: "relative",
            marginBottom: "40px",
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

          <h2
            style={{
              textAlign: "center",
              color: "#6c4ccf",
              fontSize: "34px",
              fontWeight: "700",
              margin: 0,
            }}
          >
            My Classes
          </h2>
        </div>

        {/* JOIN CLASS SECTION */}

        <div
          style={{
            marginBottom: "40px",
            padding: "25px",
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #ddd",
          }}
        >
          <h3
            style={{
              color: "#6c4ccf",
              marginBottom: "20px",
              fontWeight: "600",
            }}
          >
            Join a Class
          </h3>

          <div
            style={{
              display: "flex",
              gap: "12px",
            }}
          >
            <input
              placeholder="Enter Class Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "15px",
              }}
            />

            <button
              onClick={joinClass}
              style={{
                padding: "12px 24px",
                background: "#7b5cd6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Join Class
            </button>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "2px solid #d6d1ef" }} />

        {/* CLASS LIST */}

        {classes.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#666",
            }}
          >
            No classes joined yet. Use a class code above.
          </p>
        ) : (
          <div
            style={{
              marginTop: "30px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
              gap: "20px",
            }}
          >
            {classes.map((c) => (
              <Link
                key={c.id}
                to={`/teacher/class/${c.id}`}
                style={{
                  padding: "20px",
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #ddd",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <h4
                  style={{
                    color: "#6c4ccf",
                    marginBottom: "10px",
                    fontSize: "18px",
                  }}
                >
                  {c.name}
                </h4>

                <p
                  style={{
                    fontSize: "14px",
                    color: "#777",
                  }}
                >
                  Click to manage class
                </p>

                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "13px",
                    color: "#555",
                  }}
                >
                  Class expires: {formatClassExpiry(c.expires_at)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Teacher;
