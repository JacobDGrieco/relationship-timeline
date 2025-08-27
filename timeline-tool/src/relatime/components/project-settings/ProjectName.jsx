// ./ProjectName.jsx
import React from 'react';

export default function ProjectName({ projectName, setProjectName, onClose }) {
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "1rem" }}>
        <h2 id="sidepanel-title" style={{ margin: 0 }}>Project Name</h2>
      </div>
      <input
        type="text"
        placeholder="Enter project name"
        value={projectName || ''}
        onChange={e => setProjectName(e.target.value)}
      />
      <div className="actions">
        <button className="cancel" onClick={onClose}>Back</button>
        <button className="confirm" onClick={onClose}>Save</button>
      </div>
    </div>
  );
}
