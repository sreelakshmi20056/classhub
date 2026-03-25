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
        background:
          "radial-gradient(circle at 18% 16%, rgba(99, 82, 235, 0.2) 0%, rgba(99, 82, 235, 0) 42%), radial-gradient(circle at 82% 20%, rgba(202, 92, 255, 0.2) 0%, rgba(202, 92, 255, 0) 34%), linear-gradient(130deg, #0b1333 0%, #11193d 56%, #1a1740 100%)",
        padding: "40px 20px",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          background: "rgba(10, 18, 43, 0.78)",
          borderRadius: "18px",
          padding: "40px",
          boxShadow: "0 26px 56px rgba(3, 8, 28, 0.56)",
          border: "1px solid #253261",
          backdropFilter: "blur(10px)",
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

          <h2
            style={{
              textAlign: "center",
              color: "#d7deff",
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
            background: "#131f49",
            borderRadius: "12px",
            border: "1px solid #2d3a66",
          }}
        >
          <h3
            style={{
              color: "#c7ceff",
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
                border: "1px solid #2d3a66",
                fontSize: "15px",
                background: "#101a3c",
                color: "#eef2ff",
              }}
            />

            <button
              onClick={joinClass}
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #6d6cf7 0%, #915dff 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                boxShadow: "0 10px 28px rgba(123, 104, 255, 0.4)",
              }}
            >
              Join Class
            </button>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "2px solid #2d3a66" }} />

        {/* CLASS LIST */}

        {classes.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#9ca8d3",
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
                  background: "#131f49",
                  borderRadius: "12px",
                  border: "1px solid #2d3a66",
                  textDecoration: "none",
                  color: "#d7deff",
                  transition: "0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 14px 30px rgba(3, 8, 28, 0.55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <h4
                  style={{
                    color: "#d7deff",
                    marginBottom: "10px",
                    fontSize: "18px",
                  }}
                >
                  {c.name}
                </h4>

                <p
                  style={{
                    fontSize: "14px",
                    color: "#9ca8d3",
                  }}
                >
                  Click to manage class
                </p>

                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "13px",
                    color: "#b7c1e8",
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
