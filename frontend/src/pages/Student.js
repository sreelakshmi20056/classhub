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
        background:
          "radial-gradient(circle at 18% 16%, rgba(99, 82, 235, 0.2) 0%, rgba(99, 82, 235, 0) 42%), radial-gradient(circle at 82% 20%, rgba(202, 92, 255, 0.2) 0%, rgba(202, 92, 255, 0) 34%), linear-gradient(130deg, #0b1333 0%, #11193d 56%, #1a1740 100%)",
        fontFamily: "Segoe UI, sans-serif",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          background: "rgba(10, 18, 43, 0.78)",
          borderRadius: "18px",
          boxShadow: "0 26px 56px rgba(3, 8, 28, 0.56)",
          border: "1px solid #253261",
          backdropFilter: "blur(10px)",
          padding: "40px",
        }}
      >
        <Popup />
        <h2
          style={{
            textAlign: "center",
            color: "#d7deff",
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
            backgroundColor: "#131f49",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid #2d3a66",
          }}
        >
          <h3
            style={{
              marginBottom: "20px",
              color: "#c7ceff",
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
                border: "1px solid #2d3a66",
                borderRadius: "8px",
                fontSize: "16px",
                transition: "border-color 0.3s",
                outline: "none",
                backgroundColor: "#101a3c",
                color: "#eef2ff",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#8f7cff")}
              onBlur={(e) => (e.target.style.borderColor = "#2d3a66")}
            />
            <button
              onClick={joinClass}
              disabled={classes.length > 0}
              style={{
                padding: "12px 24px",
                background: classes.length > 0 ? "#5e6690" : "linear-gradient(135deg, #6d6cf7 0%, #915dff 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: classes.length > 0 ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "600",
                transition: "background-color 0.3s",
                boxShadow: classes.length > 0 ? "none" : "0 10px 28px rgba(123, 104, 255, 0.4)",
              }}
              onMouseEnter={(e) => !classes.length && (e.target.style.opacity = "0.92")}
              onMouseLeave={(e) => !classes.length && (e.target.style.opacity = "1")}
            >
              Join Class
            </button>
          </div>
          {classes.length > 0 && (
            <p
              style={{
                marginTop: "15px",
                fontSize: "14px",
                color: "#b7c1e8",
              }}
            >
              You are already a member of a class, so you cannot join another one.
            </p>
          )}
        </div>

        <h3
          style={{
            marginBottom: "20px",
            color: "#c7ceff",
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
                color: "#9ca8d3",
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
                  backgroundColor: "#131f49",
                  borderRadius: "12px",
                  textDecoration: "none",
                  color: "#d7deff",
                  border: "1px solid #2d3a66",
                  transition: "all 0.3s ease",
                  boxShadow: "none",
                  display: "block",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 14px 30px rgba(3, 8, 28, 0.55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#131f49";
                  e.currentTarget.style.borderColor = "#2d3a66";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <h4
                  style={{
                    margin: "0 0 10px 0",
                    color: "#d7deff",
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
                    color: "#9ca8d3",
                    fontSize: "14px",
                  }}
                >
                  Click to view class
                </p>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#b7c1e8",
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


