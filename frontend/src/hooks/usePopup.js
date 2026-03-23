import { useState, useCallback } from "react";

// A simple toast-style popup hook.
export default function usePopup(timeoutMs = 3000) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  const showPopup = useCallback(
    (msg) => {
      setMessage(msg);
      setVisible(true);
      setTimeout(() => {
        setVisible(false);
      }, timeoutMs);
    },
    [timeoutMs]
  );

  const Popup = () => {
    if (!visible) return null;
    return (
      <div
        style={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "12px 16px",
          backgroundColor: "#f8d7da",
          color: "#842029",
          border: "1px solid #f5c2c7",
          borderRadius: 10,
          zIndex: 9999,
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          maxWidth: 340,
          wordBreak: "break-word",
          fontSize: 14,
        }}
      >
        {message}
      </div>
    );
  };

  return [Popup, showPopup];
}
