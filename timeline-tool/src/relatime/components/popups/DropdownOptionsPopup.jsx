import React, { useEffect, useMemo, useState } from "react";
import "../../styles/master-style.css";

export default function DropdownOptionsPopup({ field, onSave, onClose, className = '' }) {
    const [items, setItems] = useState(() => sanitize(field?.options));
    const [draft, setDraft] = useState("");

    useEffect(() => {
        setItems(sanitize(field?.options));
    }, [field?.id]);

    const title = useMemo(
        () => (field?.label ? `Edit Options — ${field.label}` : "Edit Options"),
        [field?.label]
    );

    const addItem = () => {
        const v = draft.trim();
        if (!v) return;
        setItems(prev => sortAlpha(dedupe([...prev, v])));
        setDraft("");
    };

    const removeItem = (v) => {
        setItems(prev => prev.filter(x => x !== v));
    };

    const handleSave = () => {
        onSave(sortAlpha(dedupe(items)));
    };

    return (
        <div
            className={`popup popup-side ${className}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dropdown-options-title"
            style={{ width: 420, maxWidth: "95%" }}
        >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                <h2 id="dropdown-options-title">{title}</h2>
                <span className="dropdown-options-chip" title={field?.type}>{prettyType(field?.type)}</span>
            </div>

            {/* Add row */}
            <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem", marginBottom: ".5rem" }}>
                <input
                    type="text"
                    placeholder="Add a new option"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") addItem();
                    }}
                />
                <button onClick={addItem}>Add option</button>
            </div>

            {/* List of options (uses .popup ul/li styles) */}
            <ul>
                {items.length === 0 ? (
                    <li style={{ opacity: 0.7, fontStyle: "italic" }}>No options yet</li>
                ) : (
                    items.map(opt => (
                        <li key={opt} style={{ justifyContent: "space-between" }}>
                            <span title={opt}>{opt}</span>
                            <button onClick={() => removeItem(opt)} style={{borderRadius: "0.375rem", padding: "0.35rem 0.65rem"}}>Delete</button>
                        </li>
                    ))
                )}
            </ul>

            {/* Actions (reuses .popup .actions styles) */}
            <div className="actions">
                <button className="cancel" onClick={onClose}>Cancel</button>
                <button className="confirm" onClick={handleSave}>Save</button>
            </div>
        </div>
    );
}

function sanitize(arr) {
    return sortAlpha(dedupe((Array.isArray(arr) ? arr : []).map(s => (s ?? "").trim()).filter(Boolean)));
}
function dedupe(arr) {
    return Array.from(new Set(arr));
}
function sortAlpha(arr) {
    return [...arr].sort((a, b) => a.localeCompare(b));
}
function prettyType(t) {
    if (!t) return "";
    if (t === "dropdown") return "Dropdown";
    if (t === "static-multiselect") return "Static Multiselect";
    if (t === "dynamic-multiselect") return "Dynamic Multiselect";
    return t;
}
