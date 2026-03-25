import { useEffect, useRef, useState } from "react";
import usePopup from "../hooks/usePopup";
import API from "../api";
import { useNavigate } from "react-router-dom";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const rightPanelTitle = "Learning, Organized";
  const rightPanelDescription = "ClassHub helps coordinators, teachers, and students manage classes, assignments, notes, announcements, and submissions in one unified workspace. Organize daily academic activities, share learning resources, publish updates instantly, and keep everyone aligned through role-based dashboards designed for smooth classroom collaboration.";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [animatedTitle, setAnimatedTitle] = useState("");
  const [animatedDescription, setAnimatedDescription] = useState("");
  const [Popup, showPopup] = usePopup();
  const navigate = useNavigate();
  const googleTokenClientRef = useRef(null);
  const [googleClientId, setGoogleClientId] = useState(process.env.REACT_APP_GOOGLE_CLIENT_ID || "");

  const handleAuthSuccess = (data) => {
    if (!data?.token) {
      showPopup(data?.message || "Unexpected response from server");
      return;
    }
    localStorage.setItem("token", data.token);
    const role = (data.role || "").toLowerCase();
    localStorage.setItem("role", role);
    if (role === "coordinator") return navigate("/coordinator");
    if (role === "teacher") return navigate("/teacher");
    if (role === "student") return navigate("/student");
    navigate("/");
  };

  useEffect(() => {
    const loadGoogleClientId = async () => {
      if (googleClientId) return;
      try {
        const res = await API.get("/auth/google-config");
        if (res.data?.clientId) {
          setGoogleClientId(res.data.clientId);
        }
      } catch (err) {
        console.error("Failed to load Google config", err);
      }
    };

    loadGoogleClientId();
  }, [googleClientId]);

  useEffect(() => {
    if (!googleClientId) return undefined;

    const initTokenClient = () => {
      if (!window.google?.accounts?.oauth2) return;
      googleTokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: "openid email profile",
        callback: async (tokenResponse) => {
          if (!tokenResponse?.access_token) {
            showPopup("Google sign-in failed");
            return;
          }
          try {
            const res = await API.post("/auth/google", { accessToken: tokenResponse.access_token });
            handleAuthSuccess(res.data);
          } catch (err) {
            const msg = err.response?.data?.message || err.message;
            showPopup("Google sign-in failed: " + msg);
          }
        },
      });
    };

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      if (window.google?.accounts?.oauth2) {
        initTokenClient();
      } else {
        existingScript.addEventListener("load", initTokenClient, { once: true });
      }
      return undefined;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initTokenClient;
    document.body.appendChild(script);
    return undefined;
  }, [googleClientId, showPopup]);

  useEffect(() => {
    setAnimatedTitle("");
    setAnimatedDescription("");

    let titleIndex = 0;
    let descIndex = 0;
    let descTimer = null;

    const titleTimer = setInterval(() => {
      titleIndex += 1;
      setAnimatedTitle(rightPanelTitle.slice(0, titleIndex));

      if (titleIndex >= rightPanelTitle.length) {
        clearInterval(titleTimer);

        descTimer = setInterval(() => {
          descIndex += 1;
          setAnimatedDescription(rightPanelDescription.slice(0, descIndex));
          if (descIndex >= rightPanelDescription.length) {
            clearInterval(descTimer);
          }
        }, 22);
      }
    }, 75);

    return () => {
      clearInterval(titleTimer);
      if (descTimer) clearInterval(descTimer);
    };
  }, []);

  const login = async () => {
    try {
      const res = await API.post("/auth/login", { email, password });
      handleAuthSuccess(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      showPopup("Login failed: " + msg);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      showPopup("Enter your email first, then click Forgot password.");
      return;
    }

    try {
      const res = await API.post("/auth/forgot-password", { email: normalizedEmail });
      showPopup(res.data?.message || "If this email is registered, a reset link has been sent.");
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      showPopup("Forgot password failed: " + msg);
    }
  };

  const handleGoogleSignIn = () => {
    if (!googleClientId) {
      showPopup("Google sign-in is not configured");
      return;
    }
    if (!googleTokenClientRef.current) {
      showPopup("Google sign-in is loading. Please try again.");
      return;
    }
    googleTokenClientRef.current.requestAccessToken({ prompt: "select_account" });
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      showPopup("Please enter a valid email address");
      return;
    }
    login();
  };

  return (
    <>
      <style>
        {`
          .login-illustration-wrap {
            animation: classhubFloat 4.2s ease-in-out infinite;
            transform-origin: center;
          }

          .login-description-card {
            animation: classhubFadeUp 0.8s ease-out;
            background: rgba(16, 26, 61, 0.9);
            border: 1px solid #2a3560;
            border-radius: 18px;
            padding: 28px;
            width: 100%;
            max-width: 520px;
            box-shadow: 0 22px 48px rgba(3, 8, 28, 0.58);
          }

          .login-panel-glow {
            position: absolute;
            width: 340px;
            height: 340px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(137, 108, 255, 0.34) 0%, rgba(137,108,255,0) 72%);
            filter: blur(8px);
            animation: classhubPulse 3.6s ease-in-out infinite;
          }

          @keyframes classhubFloat {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }

          @keyframes classhubFadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes classhubPulse {
            0%, 100% { opacity: 0.55; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.08); }
          }

        `}
      </style>
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#060d26",
          backgroundImage:
            "radial-gradient(circle at 18% 16%, rgba(99, 82, 235, 0.2) 0%, rgba(99, 82, 235, 0) 42%), radial-gradient(circle at 82% 20%, rgba(202, 92, 255, 0.2) 0%, rgba(202, 92, 255, 0) 34%), linear-gradient(130deg, #0b1333 0%, #11193d 56%, #1a1740 100%)",
          padding: "24px",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
      <div
        style={{
          position: "absolute",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          top: "-90px",
          left: "-70px",
          background: "radial-gradient(circle, rgba(117, 106, 255, 0.3) 0%, rgba(117,106,255,0) 70%)",
          filter: "blur(4px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          bottom: "-70px",
          right: "-50px",
          background: "radial-gradient(circle, rgba(211, 96, 255, 0.26) 0%, rgba(211,96,255,0) 72%)",
          filter: "blur(3px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          background: "rgba(10, 18, 43, 0.75)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          boxShadow: "0 26px 56px rgba(3, 8, 28, 0.56)",
          border: "1px solid #253261",
          overflow: "hidden",
          display: "flex",
          flexWrap: "wrap",
          position: "relative",
          zIndex: 1,
        }}
      >
      {/* LEFT: Login Form */}
      <div
        style={{
          flex: "1 1 560px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "transparent",
          padding: "56px 52px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "32px" }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #7f6aff 0%, #cb59ff 100%)", borderRadius: 8, marginRight: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px rgba(141, 107, 255, 0.45)" }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 22 }}>■</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 22, color: "#e3e8ff" }}>ClassHub</span>
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 8, color: "#d7deff" }}>Welcome back</h2>
          <div style={{ color: "#8e98be", fontSize: 15, marginBottom: 24 }}>Please enter your details</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontWeight: 500, fontSize: 15, marginBottom: 6, color: "#bfc7ed" }}>Email address <span style={{ color: "#ff6f97" }}>*</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
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
              {emailError && (
                <div style={{ fontSize: "12px", color: "#ff88a9", marginBottom: 0 }}>{emailError}</div>
              )}
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
                  background: "#101a3c",
                  color: "#eef2ff",
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
              <input type="checkbox" id="remember" style={{ marginRight: 8 }} />
              <label htmlFor="remember" style={{ fontSize: 14, color: "#8d97bf" }}>Remember for 30 days</label>
              <a href="#" onClick={handleForgotPassword} style={{ marginLeft: "auto", fontSize: 14, color: "#8f7cff", textDecoration: "none" }}>Forgot password</a>
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
              Sign in
            </button>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: "#2d3a66" }} />
              <span style={{ margin: "0 12px", color: "#7f8bb6", fontSize: 14 }}>or</span>
              <div style={{ flex: 1, height: 1, background: "#2d3a66" }} />
            </div>
            <button
              type="button"
              style={{
                width: "100%",
                padding: "12px",
                background: "#121e47",
                color: "#e3e8ff",
                border: "1px solid #2d3a66",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onClick={handleGoogleSignIn}
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png" alt="Google" style={{ width: 20, height: 20 }} />
              Sign in with Google
            </button>
            <div style={{ textAlign: "center", marginTop: 18, color: "#8e98be", fontSize: 14 }}>
              Don't have an account? <a href="/register" style={{ color: "#8f7cff", textDecoration: "none" }}>Sign up</a>
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          gap: "18px",
          padding: "42px 30px",
          boxSizing: "border-box",
        }}
      >
        <div className="login-panel-glow" />
        <div className="login-description-card" style={{ zIndex: 1, transform: "translateX(-20px)" }}>
          <h3 style={{ margin: "0 0 10px", color: "#c7ceff", fontSize: "20px", fontWeight: 700, letterSpacing: "0.2px" }}>
            {animatedTitle}
            {animatedTitle.length < rightPanelTitle.length && <span style={{ color: "#8f7cff" }}>|</span>}
          </h3>
          <p style={{ margin: "0 0 16px", color: "#9ca8d3", lineHeight: 1.55, fontSize: "14px", minHeight: 110 }}>
            {animatedDescription}
            {animatedTitle.length === rightPanelTitle.length && animatedDescription.length < rightPanelDescription.length && <span style={{ color: "#8f7cff" }}>|</span>}
          </p>

          <div className="login-illustration-wrap" style={{ width: "100%", maxWidth: 360, height: 210, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="100%" height="100%" viewBox="0 0 420 280" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="420" height="280" rx="28" fill="#131f49" />
            {/* Abstract illustration: person, computer, icons, checkmark, etc. */}
            <g>
              <ellipse cx="210" cy="220" rx="120" ry="36" fill="#5245ca" opacity="0.9" />
              <rect x="110" y="95" width="200" height="105" rx="18" fill="#1f2a57" />
              <path d="M210 154c28 0 38 34 38 58v8h-76v-8c0-24 10-58 38-58z" fill="#7061ff" />
              <circle cx="210" cy="138" r="33" fill="#fff" />
              <path d="M210 129c9 0 17 8 17 17s-8 17-17 17-17-8-17-17 8-17 17-17z" fill="#7061ff" />
              <rect x="163" y="188" width="94" height="18" rx="8" fill="#fff" />
              <circle cx="258" cy="126" r="7" fill="#fff" />
              <circle cx="162" cy="126" r="7" fill="#fff" />
              <rect x="126" y="228" width="168" height="10" rx="5" fill="#fff" />
              {/* Checkmark */}
              <polyline points="191,150 209,168 228,132" stroke="#fff" strokeWidth="5" fill="none" />
            </g>
            {/* Floating icons */}
            <g>
              <rect x="55" y="48" width="24" height="24" rx="12" fill="#41528f" />
              <rect x="341" y="48" width="24" height="24" rx="12" fill="#41528f" />
              <rect x="55" y="235" width="24" height="24" rx="12" fill="#41528f" />
              <rect x="341" y="235" width="24" height="24" rx="12" fill="#41528f" />
              <circle cx="370" cy="150" r="13" fill="#41528f" />
              <circle cx="50" cy="150" r="13" fill="#41528f" />
            </g>
          </svg>
          </div>
        </div>
      </div>
      </div>
      </div>
    </>
  );
}


