// ./components/NodeConnectionTypesPopup.jsx
import React, { useEffect, useState } from "react";

export default function NodeConnectionTypesPopup({
    projectSettings,
    setProjectSettings,
    networkRef,
    nodeDetails,
    setNodeDetails,
    onNodeTypesDeleted,
    onClose,
}) {
    const [nodes, setNodes] = useState(() => sanitize(projectSettings?.nodeTypes));
    const [conns, setConns] = useState(() => sanitize(projectSettings?.connectionTypes));
    const [draftNode, setDraftNode] = useState("");
    const [draftConn, setDraftConn] = useState("");

    useEffect(() => setNodes(sanitize(projectSettings?.nodeTypes)), [projectSettings?.nodeTypes]);
    useEffect(() => setConns(sanitize(projectSettings?.connectionTypes)), [projectSettings?.connectionTypes]);

    const addNodeType = () => {
        const v = (draftNode || "").trim();
        if (!v) return;
        setNodes(prev => sortAlpha(dedupe([...prev, v])));
        setDraftNode("");
    };
    const addConnType = () => {
        const v = (draftConn || "").trim();
        if (!v) return;
        setConns(prev => sortAlpha(dedupe([...prev, v])));
        setDraftConn("");
    };

    const removeNodeType = (v) => setNodes(prev => prev.filter(x => x !== v));
    const removeConnType = (v) => setConns(prev => prev.filter(x => x !== v));

    const handleSave = () => {
        const beforeNT = Array.isArray(projectSettings?.nodeTypes) ? projectSettings.nodeTypes : [];
        const nt = sortAlpha(dedupe(nodes));
        const ct = sortAlpha(dedupe(conns));

        // figure out which node types were deleted
        const deleted = beforeNT.filter(x => !nt.includes(x));
        const replacement = nt[0] || "Default";
        if (deleted.length && typeof onNodeTypesDeleted === 'function') {
            onNodeTypesDeleted(deleted, replacement, setNodeDetails, nodeDetails, networkRef);
        }

        setProjectSettings(prev => ({ ...prev, nodeTypes: nt, connectionTypes: ct }));
        onClose();
    };

    return (
        <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "1rem" }}>
                <h2 id="sidepanel-title" style={{ margin: 0 }}>Node / Connection Types</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Node Types */}
                <div>
                    <h3 style={{ margin: 0 }}>Node Types</h3>
                    <div style={{ display: "flex", gap: ".5rem", margin: ".75rem 0" }}>
                        <input
                            type="text"
                            placeholder="Add a node type"
                            value={draftNode}
                            onChange={e => setDraftNode(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addNodeType()}
                        />
                        <button onClick={addNodeType}>Add</button>
                    </div>
                    <ul>
                        {nodes.length === 0 ? (
                            <li style={{ opacity: 0.7, fontStyle: "italic" }}>No node types yet</li>
                        ) : (
                            nodes.map(t => (
                                <li key={t} style={{ justifyContent: "space-between" }}>
                                    <span title={t}>{t}</span>
                                    <button onClick={() => removeNodeType(t)} style={{ borderRadius: "0.375rem", padding: "0.35rem 0.65rem" }}>
                                        Delete
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                {/* Connection Types */}
                <div>
                    <h3 style={{ margin: 0 }}>Connection Types</h3>
                    <div style={{ display: "flex", gap: ".5rem", margin: ".75rem 0" }}>
                        <input
                            type="text"
                            placeholder="Add a connection type"
                            value={draftConn}
                            onChange={e => setDraftConn(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addConnType()}
                        />
                        <button onClick={addConnType}>Add</button>
                    </div>
                    <ul>
                        {conns.length === 0 ? (
                            <li style={{ opacity: 0.7, fontStyle: "italic" }}>No connection types yet</li>
                        ) : (
                            conns.map(t => (
                                <li key={t} style={{ justifyContent: "space-between" }}>
                                    <span title={t}>{t}</span>
                                    <button onClick={() => removeConnType(t)} style={{ borderRadius: "0.375rem", padding: "0.35rem 0.65rem" }}>
                                        Delete
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            <div className="actions">
                <button className="cancel" onClick={onClose}>Back</button>
                <button className="confirm" onClick={handleSave}>Save</button>
            </div>
        </>
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
