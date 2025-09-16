import React, { useMemo, useState } from "react";

const EMPTY_RULE = () => ({
    id: crypto.randomUUID(),
    match: { mode: "type", type: "" },
    style: { color: "", shape: "", size: "", imageOpacity: "" }
});

export default function NodeConnectionCSSPopup({
    projectSettings,            // full project settings object
    setProjectSettings,         // setter that updates project settings
    availableFieldNames = [],
    onClose,
}) {
    const initial = useMemo(() => {
        const nc = projectSettings?.nodeStyles;
        return {
            defaultStyle: {
                color: nc?.defaultStyle?.color ?? "#888888",
                shape: nc?.defaultStyle?.shape ?? "dot",
                size: nc?.defaultStyle?.size ?? 30,
                imageOpacity: nc?.defaultStyle?.imageOpacity ?? 1,
            },
            rules: Array.isArray(nc?.rules) ? nc.rules : []
        };
    }, [projectSettings]);
    const [working, setWorking] = useState(initial);

    const handleSave = () => {
        setProjectSettings(prev => {
            const next = { ...(prev || {}) };
            next.nodeStyles = {
                defaultStyle: {
                    color: working.defaultStyle.color || "#888888",
                    shape: working.defaultStyle.shape || "dot",
                    size: Number(working.defaultStyle.size) || 30,
                    imageOpacity: clamp01(Number(working.defaultStyle.imageOpacity)),
                },
                rules: working.rules
            };
            return next;
        });
        onClose();
    };

    return (
        <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "1rem" }}>
                <h2 id="sidepanel-title" style={{ margin: 0 }}>Node / Connection Styles</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
                {/* Node CSS */}
                <div>
                    <h3 style={{ margin: 0 }}>Node Styles</h3>
                    <fieldset style={{ marginTop: ".5rem" }}>
                        <legend>Default Style</legend>
                        <label style={{ display: "grid", gridTemplateColumns: "140px 1fr", alignItems: "center", gap: ".5rem" }}>
                            <span style={{ opacity: .8 }}>Color</span>
                            <input
                                type="color"
                                value={working.defaultStyle.color}
                                onChange={e => setWorking(w => ({ ...w, defaultStyle: { ...w.defaultStyle, color: e.target.value } }))}
                            />
                        </label>
                        {/* You can add shape/size/imageOpacity inputs later */}
                    </fieldset>
                </div>

                {/* Connection CSS
                <div>
                    <h3 style={{ margin: 0 }}>Connection CSS</h3>
                </div> */}
            </div>

            <div className="actions">
                <button className="cancel" onClick={onClose}>Back</button>
                <button className="confirm" onClick={handleSave}>Save</button>
            </div>
        </>
    );
}

function clamp01(n) { return Math.max(0, Math.min(1, isNaN(n) ? 1 : Number(n))); }