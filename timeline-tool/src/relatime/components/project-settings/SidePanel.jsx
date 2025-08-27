// ./SidePanel.jsx
import React from "react";
import "../../styles/master-style.css";

export default function SidePanel({ title, className = "", onClose, children, width = '50%' }) {
  return (
    <div
      className={`popup popup-side ${className}`}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sidepanel-title"
      style={{ width, maxWidth: "95%" }}
    >
      <div style={{ marginTop: "1rem" }}>
        {children}
      </div>
    </div>
  );
}
