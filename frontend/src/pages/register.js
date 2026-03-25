import { useState } from "react";
import usePopup from "../hooks/usePopup";
import API from "../api";
import { useNavigate } from "react-router-dom";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [Popup, showPopup] = usePopup();
  const navigate = useNavigate();

  const handleEmailChange = (value) => {
    setEmail(value);
    if (!value) {
      setEmailError("");
      return;
    }
    const normalized = value.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      setEmailError("Invalid email format");
    } else {
      setEmailError("");
    }
  };

  const sendOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      showPopup("Please enter a valid email address");
      return;
    }

    try {
      setSendingOtp(true);
      const res = await API.post("/auth/register/send-otp", { email: normalizedEmail });
      setOtpSent(true);
      showPopup(res.data.message || "OTP sent to your email");
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        showPopup("OTP service timed out. Please try again in a moment.");
        return;
      }
      if (err.response?.status === 503) {
        showPopup("Registration is temporarily unavailable because email validation service is down. Please try again in a few minutes.");
        return;
      }
      showPopup(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const register = async () => {
    if (email && !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      showPopup("Please enter a valid email address");
      return;
    }

    if (!otpSent) {
      showPopup("Please send OTP to your email first");
      return;
    }

    if (!String(otp).trim()) {
      showPopup("Please enter OTP sent to your email");
      return;
    }

    try {
      const res = await API.post("/auth/register", {
        name,
        email,
        password,
        role,
        otp: String(otp).trim(),
      });

      showPopup(res.data.message);
      navigate("/");
    } catch (err) {
      console.log(err.response?.data);
      if (err.response?.status === 503) {
        showPopup("Registration is temporarily unavailable because email validation service is down. Please try again in a few minutes.");
        return;
      }
      showPopup(err.response?.data?.message || "Please enter valid email address");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        backgroundColor: "#060d26",
        backgroundImage:
          "radial-gradient(circle at 18% 16%, rgba(99, 82, 235, 0.2) 0%, rgba(99, 82, 235, 0) 42%), radial-gradient(circle at 82% 20%, rgba(202, 92, 255, 0.2) 0%, rgba(202, 92, 255, 0) 34%), linear-gradient(130deg, #0b1333 0%, #11193d 56%, #1a1740 100%)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* LEFT: Register Form */}
      <div
        style={{
          flex: "1 1 560px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "rgba(10, 18, 43, 0.75)",
          borderRight: "1px solid #253261",
          backdropFilter: "blur(10px)",
          padding: "0 40px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "32px" }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #7f6aff 0%, #cb59ff 100%)", borderRadius: 8, marginRight: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px rgba(141, 107, 255, 0.45)" }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 22 }}>■</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 22, color: "#e3e8ff" }}>ClassHub</span>
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 8, color: "#d7deff" }}>Create Account</h2>
          <div style={{ color: "#8e98be", fontSize: 15, marginBottom: 24 }}>Please enter your details</div>
          <form onSubmit={e => { e.preventDefault(); register(); }}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontWeight: 500, fontSize: 15, marginBottom: 6, color: "#bfc7ed" }}>Full Name <span style={{ color: "#ff6f97" }}>*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #2d3a66",
                  borderRadius: "10px",
                  fontSize: "15px",
                  marginBottom: 0,
                  boxSizing: "border-box",
                  backgroundColor: "#101a3c",
                  color: "#eef2ff",
                }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontWeight: 500, fontSize: 15, marginBottom: 6, color: "#bfc7ed" }}>Email address <span style={{ color: "#ff6f97" }}>*</span></label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    handleEmailChange(e.target.value);
                    setOtpSent(false);
                    setOtp("");
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: emailError ? "1px solid #ff6f97" : "1px solid #2d3a66",
                    borderRadius: "10px",
                    fontSize: "15px",
                    marginBottom: emailError ? 4 : 0,
                    boxSizing: "border-box",
                    backgroundColor: emailError ? "rgba(255,111,151,0.14)" : "#101a3c",
                    color: "#eef2ff",
                  }}
                />
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={sendingOtp}
                  style={{
                    minWidth: 108,
                    padding: "0 10px",
                    border: "none",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #6d6cf7 0%, #915dff 100%)",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: sendingOtp ? "not-allowed" : "pointer",
                    opacity: sendingOtp ? 0.7 : 1,
                    boxShadow: "0 10px 24px rgba(123, 104, 255, 0.35)",
                  }}
                >
                  {sendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                </button>
              </div>
              {emailError && (
                <div style={{ fontSize: "12px", color: "#ff88a9", marginBottom: 0 }}>{emailError}</div>
              )}
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontWeight: 500, fontSize: 15, marginBottom: 6, color: "#bfc7ed" }}>OTP <span style={{ color: "#ff6f97" }}>*</span></label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #2d3a66",
                  borderRadius: "10px",
                  fontSize: "15px",
                  marginBottom: 0,
                  boxSizing: "border-box",
                  backgroundColor: "#101a3c",
                  color: "#eef2ff",
                }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontWeight: 500, fontSize: 15, marginBottom: 6, color: "#bfc7ed" }}>Password <span style={{ color: "#ff6f97" }}>*</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #2d3a66",
                  borderRadius: "10px",
                  fontSize: "15px",
                  marginBottom: 0,
                  boxSizing: "border-box",
                  backgroundColor: "#101a3c",
                  color: "#eef2ff",
                }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontWeight: 500, fontSize: 15, marginBottom: 6, color: "#bfc7ed" }}>Role <span style={{ color: "#ff6f97" }}>*</span></label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #2d3a66",
                  borderRadius: "10px",
                  fontSize: "15px",
                  marginBottom: 0,
                  boxSizing: "border-box",
                  backgroundColor: "#101a3c",
                  color: "#eef2ff",
                }}
              >
                <option value="">Select Role</option>
                <option value="coordinator">Coordinator</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #6d6cf7 0%, #915dff 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: 16,
                marginBottom: 16,
                cursor: "pointer",
                boxShadow: "0 10px 28px rgba(123, 104, 255, 0.4)",
              }}
            >
              Register
            </button>
            <div style={{ textAlign: "center", marginTop: 18, color: "#8e98be", fontSize: 14 }}>
              Already have an account? <a href="/" style={{ color: "#8f7cff", textDecoration: "none" }}>Login here</a>
            </div>
          </form>
          <Popup />
        </div>
      </div>
      {/* RIGHT: Illustration */}
      <div
        style={{
          flex: "1 1 440px",
          background: "linear-gradient(145deg, rgba(30, 42, 92, 0.6) 0%, rgba(50, 41, 98, 0.72) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Illustration block */}
        <div style={{ width: "80%", maxWidth: 420, height: 420, background: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* SVG illustration matching the design */}
          <svg width="100%" height="100%" viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="420" height="420" rx="32" fill="#131f49" />
            {/* Abstract illustration: person, computer, icons, checkmark, etc. */}
            <g>
              <ellipse cx="210" cy="320" rx="120" ry="40" fill="#5245ca" />
              <rect x="110" y="140" width="200" height="120" rx="18" fill="#1f2a57" />
              <path d="M210 210c30 0 40 40 40 70v30h-80v-30c0-30 10-70 40-70z" fill="#7061ff" />
              <circle cx="210" cy="180" r="40" fill="#fff" />
              <path d="M210 170c10 0 20 10 20 20s-10 20-20 20-20-10-20-20 10-20 20-20z" fill="#7061ff" />
              <rect x="170" y="250" width="80" height="20" rx="8" fill="#fff" />
              <circle cx="260" cy="170" r="8" fill="#fff" />
              <circle cx="160" cy="170" r="8" fill="#fff" />
              <rect x="120" y="280" width="180" height="10" rx="5" fill="#fff" />
              {/* Checkmark */}
              <polyline points="190,200 210,220 230,180" stroke="#fff" strokeWidth="6" fill="none" />
            </g>
            {/* Floating icons */}
            <g>
              <rect x="60" y="60" width="32" height="32" rx="16" fill="#41528f" />
              <rect x="328" y="60" width="32" height="32" rx="16" fill="#41528f" />
              <rect x="60" y="328" width="32" height="32" rx="16" fill="#41528f" />
              <rect x="328" y="328" width="32" height="32" rx="16" fill="#41528f" />
              <circle cx="370" cy="210" r="16" fill="#41528f" />
              <circle cx="50" cy="210" r="16" fill="#41528f" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}


