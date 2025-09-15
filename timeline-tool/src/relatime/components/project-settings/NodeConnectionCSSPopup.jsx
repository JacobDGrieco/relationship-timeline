import React, { useEffect, useState } from "react";

export default function NodeConnectionCSSPopup({
    networkRef,
    onClose,
}) {
    const handleSave = () => {
        onClose();
    };

    return (
        <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "1rem" }}>
                <h2 id="sidepanel-title" style={{ margin: 0 }}>Node / Connection CSS</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Node CSS */}
                <div>
                    <h3 style={{ margin: 0 }}>Node CSS</h3>
                    <div style={{ display: "flex", gap: ".5rem", margin: ".75rem 0" }}>
                        <textarea />
                    </div>
                </div>

                {/* Connection CSS */}
                <div>
                    <h3 style={{ margin: 0 }}>Connection CSS</h3>
                    <div style={{ display: "flex", gap: ".5rem", margin: ".75rem 0" }}>
                        <textarea />
                    </div>
                </div>
            </div>

            <div className="actions">
                <button className="cancel" onClick={onClose}>Back</button>
                <button className="confirm" onClick={handleSave}>Save</button>
            </div>
        </>
    );
}