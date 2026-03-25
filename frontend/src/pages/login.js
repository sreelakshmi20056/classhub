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
            background: #ffffff;
            border: none;
            border-radius: 18px;
            padding: 28px;
            width: 100%;
            max-width: 520px;
            box-shadow: 0 14px 36px rgba(91, 66, 169, 0.12);
          }

          .login-panel-glow {
            position: absolute;
            width: 340px;
            height: 340px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(124,92,191,0.18) 0%, rgba(124,92,191,0) 70%);
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
          backgroundColor: "#f8f7fc",
          backgroundImage:
            "radial-gradient(circle at 12% 18%, rgba(124, 92, 191, 0.16) 0%, rgba(124, 92, 191, 0) 32%), radial-gradient(circle at 88% 22%, rgba(148, 126, 210, 0.18) 0%, rgba(148, 126, 210, 0) 30%), radial-gradient(circle at 50% 88%, rgba(197, 181, 234, 0.35) 0%, rgba(197, 181, 234, 0) 42%), linear-gradient(180deg, #fbfaff 0%, #f4f1fb 100%)",
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
          background: "radial-gradient(circle, rgba(124,92,191,0.28) 0%, rgba(124,92,191,0) 70%)",
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
          background: "radial-gradient(circle, rgba(124,92,191,0.22) 0%, rgba(124,92,191,0) 72%)",
          filter: "blur(3px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          background: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 18px 42px rgba(0, 0, 0, 0.09)",
          border: "1px solid #ebe6f7",
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
          background: "#fff",
          padding: "56px 52px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "32px" }}>
            <div style={{ width: 32, height: 32, background: "#7c5cbf", borderRadius: 6, marginRight: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 22 }}>■</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 22, color: "#222" }}>ClassHub</span>
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 8 }}>Welcome back</h2>
          <div style={{ color: "#888", fontSize: 15, marginBottom: 24 }}>Please enter your details</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontWeight: 500, fontSize: 15, marginBottom: 6 }}>Email address <span style={{ color: "#dc3545" }}>*</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: emailError ? "1px solid #dc3545" : "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "15px",
                  marginBottom: emailError ? 4 : 0,
                  boxSizing: "border-box",
                  backgroundColor: emailError ? "#fff5f5" : "#fff",
                }}
              />
              {emailError && (
                <div style={{ fontSize: "12px", color: "#dc3545", marginBottom: 0 }}>{emailError}</div>
              )}
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontWeight: 500, fontSize: 15, marginBottom: 6 }}>Password <span style={{ color: "#dc3545" }}>*</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "15px",
                  marginBottom: 0,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
              <input type="checkbox" id="remember" style={{ marginRight: 8 }} />
              <label htmlFor="remember" style={{ fontSize: 14, color: "#555" }}>Remember for 30 days</label>
              <a href="#" onClick={handleForgotPassword} style={{ marginLeft: "auto", fontSize: 14, color: "#7c5cbf", textDecoration: "none" }}>Forgot password</a>
            </div>
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                background: "#7c5cbf",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: 16,
                marginBottom: 16,
                cursor: "pointer",
              }}
            >
              Sign in
            </button>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: "#eee" }} />
              <span style={{ margin: "0 12px", color: "#888", fontSize: 14 }}>or</span>
              <div style={{ flex: 1, height: 1, background: "#eee" }} />
            </div>
            <button
              type="button"
              style={{
                width: "100%",
                padding: "12px",
                background: "white",
                color: "#222",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
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
            <div style={{ textAlign: "center", marginTop: 18, color: "#888", fontSize: 14 }}>
              Don't have an account? <a href="/register" style={{ color: "#7c5cbf", textDecoration: "none" }}>Sign up</a>
            </div>
          </form>
          <Popup />
        </div>
      </div>
      {/* RIGHT: Illustration */}
      <div
        style={{
          flex: "1 1 440px",
          background: "#ffffff",
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
          <h3 style={{ margin: "0 0 10px", color: "#5b42a9", fontSize: "20px", fontWeight: 700, letterSpacing: "0.2px" }}>
            {animatedTitle}
            {animatedTitle.length < rightPanelTitle.length && <span style={{ color: "#6f55bb" }}>|</span>}
          </h3>
          <p style={{ margin: "0 0 16px", color: "#4a4a61", lineHeight: 1.55, fontSize: "14px", minHeight: 110 }}>
            {animatedDescription}
            {animatedTitle.length === rightPanelTitle.length && animatedDescription.length < rightPanelDescription.length && <span style={{ color: "#6f55bb" }}>|</span>}
          </p>

          <div className="login-illustration-wrap" style={{ width: "100%", maxWidth: 360, height: 210, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="100%" height="100%" viewBox="0 0 420 280" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="420" height="280" rx="28" fill="#ffffff" />
            {/* Abstract illustration: person, computer, icons, checkmark, etc. */}
            <g>
              <ellipse cx="210" cy="220" rx="120" ry="36" fill="#7654c8" opacity="0.9" />
              <rect x="110" y="95" width="200" height="105" rx="18" fill="#2a2a3f" />
              <path d="M210 154c28 0 38 34 38 58v8h-76v-8c0-24 10-58 38-58z" fill="#7c5cbf" />
              <circle cx="210" cy="138" r="33" fill="#fff" />
              <path d="M210 129c9 0 17 8 17 17s-8 17-17 17-17-8-17-17 8-17 17-17z" fill="#7c5cbf" />
              <rect x="163" y="188" width="94" height="18" rx="8" fill="#fff" />
              <circle cx="258" cy="126" r="7" fill="#fff" />
              <circle cx="162" cy="126" r="7" fill="#fff" />
              <rect x="126" y="228" width="168" height="10" rx="5" fill="#fff" />
              {/* Checkmark */}
              <polyline points="191,150 209,168 228,132" stroke="#fff" strokeWidth="5" fill="none" />
            </g>
            {/* Floating icons */}
            <g>
              <rect x="55" y="48" width="24" height="24" rx="12" fill="#d5c9f4" />
              <rect x="341" y="48" width="24" height="24" rx="12" fill="#d5c9f4" />
              <rect x="55" y="235" width="24" height="24" rx="12" fill="#d5c9f4" />
              <rect x="341" y="235" width="24" height="24" rx="12" fill="#d5c9f4" />
              <circle cx="370" cy="150" r="13" fill="#d5c9f4" />
              <circle cx="50" cy="150" r="13" fill="#d5c9f4" />
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


