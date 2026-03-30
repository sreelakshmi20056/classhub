import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "./ProfileMenu.css";

const ROLE_LABELS = {
  student: "Student",
  teacher: "Teacher",
  coordinator: "Coordinator",
};

const toRoleLabel = (role) => {
  const key = String(role || "").trim().toLowerCase();
  return ROLE_LABELS[key] || key || "-";
};

const getAvatarText = ({ name, email }) => {
  const source = String(name || email || "U").trim();
  if (!source) return "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
};

export default function ProfileMenu() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: String(localStorage.getItem("role") || "").toLowerCase(),
  });

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      try {
        const res = await API.get("/auth/me");
        if (!isActive) return;
        const data = res.data || {};
        setProfile({
          name: String(data.name || "").trim(),
          email: String(data.email || "").trim(),
          role: String(data.role || localStorage.getItem("role") || "").toLowerCase(),
        });
      } catch (error) {
        if (!isActive) return;
        console.error("Failed to load profile", error);
      }
    };

    loadProfile();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  const avatarText = useMemo(() => getAvatarText(profile), [profile]);

  const handleDeleteAccount = async () => {
    if (isDeleting) return;

    const confirmed = window.confirm(
      "Delete your account permanently? This will remove your account data and you can register again with the same email."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await API.delete("/auth/account");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      navigate("/", { replace: true });
      window.location.reload();
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Failed to delete account";
      window.alert(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="profile-menu-root" ref={rootRef}>
      <button
        type="button"
        className="profile-menu-trigger"
        aria-label="Open profile menu"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {avatarText}
      </button>

      {isOpen ? (
        <div className="profile-menu-panel" role="menu" aria-label="Profile details">
          <div className="profile-menu-label">Name</div>
          <div className="profile-menu-value">{profile.name || "-"}</div>

          <div className="profile-menu-label">Email</div>
          <div className="profile-menu-value">{profile.email || "-"}</div>

          <div className="profile-menu-label">Role</div>
          <div className="profile-menu-value">{toRoleLabel(profile.role)}</div>

          <button
            type="button"
            className="profile-menu-delete-btn"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting account..." : "Delete account"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
