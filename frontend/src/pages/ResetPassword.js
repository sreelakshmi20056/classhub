import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import API from "../api";
import usePopup from "../hooks/usePopup";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => String(searchParams.get("token") || "").trim(), [searchParams]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [Popup, showPopup] = usePopup();
  const navigate = useNavigate();

  const submitReset = async (e) => {
    e.preventDefault();

    if (!token) {
      showPopup("Invalid reset link. Please request a new one.");
      return;
    }

    if (newPassword.length < 6) {
      showPopup("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showPopup("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.post("/auth/reset-password", { token, newPassword });
      showPopup(res.data?.message || "Password reset successful");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      showPopup("Reset failed: " + msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f4fb",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          borderRadius: "10px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          padding: "24px",
        }}
      >
        <h2 style={{ margin: "0 0 10px", color: "#222" }}>Set New Password</h2>
        <p style={{ margin: "0 0 20px", color: "#666", fontSize: "14px" }}>
          Enter your new password below.
        </p>

        <form onSubmit={submitReset}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#333" }}>
              New password <span style={{ color: "#dc3545" }}>*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "11px 12px",
                fontSize: "15px",
              }}
            />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#333" }}>
              Confirm password <span style={{ color: "#dc3545" }}>*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "11px 12px",
                fontSize: "15px",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "6px",
              border: "none",
              background: submitting ? "#9d8bc8" : "#7c5cbf",
              color: "#fff",
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Updating..." : "Update Password"}
          </button>
        </form>

        <div style={{ marginTop: "14px", textAlign: "center", fontSize: "14px" }}>
          <Link to="/" style={{ color: "#7c5cbf", textDecoration: "none" }}>
            Back to login
          </Link>
        </div>
        <Popup />
      </div>
    </div>
  );
}
