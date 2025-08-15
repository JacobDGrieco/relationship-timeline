import { useMemo } from "react";
import { handleAddConnection } from "../../utils/graphHelpers"

export default function AddConnectionPopup({
    nodeDetails,
    connectionSource,
    setConnectionSource,
    connectionTarget,
    setConnectionTarget,
    connectionLabel,
    setConnectionLabel,
    connectionDirection,
    setConnectionDirection,
    connectionLevel,
    setConnectionLevel,
    editingEdgeId,
    setEditingEdgeId,
    setShowAddConnection,
    setGraphData,
    networkRef,
    timelineEntries,
    selectedSnapshotIndex,
    setTimelineEntries,
    applyMode,
    setApplyMode,
    partialStartIndex,
    setPartialStartIndex,
    partialEndIndex,
    setPartialEndIndex
}) {
    const nodeNameOptions = useMemo(() => {
        const names = Object.values(nodeDetails || {})
            .map(nd => (nd?.name || "").trim())
            .filter(Boolean);
        return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    }, [nodeDetails]);

    const nameToImage = useMemo(() => {
        const map = {};
        Object.values(nodeDetails || {}).forEach(nd => {
            const n = (nd?.name || "").trim();
            if (n && nd?.image && !map[n]) map[n] = nd.image;
        });
        return map;
    }, [nodeDetails]);

    const getInitials = (name = "") => {
        const parts = name.trim().split(/\s+/).filter(Boolean);
        const first = parts[0]?.[0] || "";
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
        return (first + last).toUpperCase() || (name[0]?.toUpperCase() || "?");
    };

    // Build options for dropdowns
    const pastEvents = timelineEntries
        .map((entry, idx) => ({ idx, entry }))
        .filter(({ idx }) => idx < selectedSnapshotIndex)
        .sort((a, b) => b.idx - a.idx); // descending by distance

    const futureEvents = timelineEntries
        .map((entry, idx) => ({ idx, entry }))
        .filter(({ idx }) => idx > selectedSnapshotIndex)
        .sort((a, b) => a.idx - b.idx); // ascending by distance

    return (
        <div className="popup-overlay">
            <div className="popup">
                <h2>Add Connection</h2>
                <div className="two-col">
                    <div className="field">
                        <label>Source Name</label>
                        <select
                            value={connectionSource || ''}
                            onChange={(e) => setConnectionSource(e.target.value)}
                        >
                            <option key="" value=""></option>
                            {nodeNameOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <div className='connectionImage'>
                            {nameToImage[connectionSource] ? (
                                <img
                                    src={nameToImage[connectionSource]}
                                    alt={`${connectionSource || 'Source'} image`}
                                />
                            ) : (
                                <div className='imgEmpty' title={connectionSource || 'No source selected'}>
                                    {connectionSource ? getInitials(connectionSource) : '—'}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="field">
                        <label>Target Name</label>
                        <select
                            value={connectionTarget || ''}
                            onChange={(e) => setConnectionTarget(e.target.value)}
                        >
                            <option key="" value=""></option>
                            {nodeNameOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <div className='connectionImage'>
                            {nameToImage[connectionTarget] ? (
                                <img
                                    src={nameToImage[connectionTarget]}
                                    alt={`${connectionTarget || 'Target'} image`}
                                />
                            ) : (
                                <div className='imgEmpty' title={connectionTarget || 'No target selected'}>
                                    {connectionTarget ? getInitials(connectionTarget) : '—'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <label>Connection Name (Label)</label>
                <input
                    type="text"
                    value={connectionLabel}
                    onChange={(e) => setConnectionLabel(e.target.value)}
                    placeholder="Optional label"
                />
                <label>Direction</label>
                <div className="connection-direction buttons">
                    {['normal', 'reverse', 'both', 'none'].map((dir) => (
                        <label key={dir} className="direction-option">
                            <input
                                type="radio"
                                value={dir}
                                checked={connectionDirection === dir}
                                onChange={(e) => setConnectionDirection(e.target.value)}
                            />
                            {dir.charAt(0).toUpperCase() + dir.slice(1)}
                        </label>
                    ))}
                </div>
                <label>Connection Level</label>
                <div className="connection-level buttons">
                    {[
                        { value: 1, label: "Normal" },
                        { value: 2, label: "Strong" },
                        { value: 0, label: "Weak" },
                    ].map(opt => (
                        <label key={opt.value} className="level-option">
                            <input
                                type="radio"
                                value={opt.value}
                                checked={connectionLevel === opt.value}
                                onChange={(e) => setConnectionLevel(parseInt(e.target.value, 10))}
                            />
                            {opt.label}
                        </label>
                    ))}
                </div>
                <label>Apply To Snapshots</label>
                <select value={applyMode} onChange={(e) => setApplyMode(e.target.value)}>
                    <option value="none">None</option>
                    <option value="forward">Fully Forward</option>
                    <option value="backward">Fully Backward</option>
                    <option value="full">Full (All Snapshots)</option>
                    <option value="partial">Partial Range</option>
                </select>
                {
                    applyMode === 'partial' && (
                        <>
                            <label>Earliest Event</label>
                            <select
                                value={partialStartIndex ?? ""}
                                onChange={(e) => setPartialStartIndex(e.target.value ? parseInt(e.target.value, 10) : null)}
                            >
                                <option value="">--</option>
                                {pastEvents.map(({ idx, entry }) => (
                                    <option key={idx} value={idx}>
                                        onChange={(e) => setPartialEndIndex(e.target.value ? parseInt(e.target.value, 10) : null)}
                                    </option>
                                ))}
                            </select>
                            <label>Latest Event</label>
                            <select
                                value={partialEndIndex ?? ""}
                                onChange={(e) => setPartialEndIndex(e.target.value ? parseInt(e.target.value, 10) : null)}
                            >
                                <option value="">--</option>
                                {futureEvents.map(({ idx, entry }) => (
                                    <option key={idx} value={idx}>
                                        onChange={(e) => setPartialEndIndex(e.target.value ? parseInt(e.target.value, 10) : null)}
                                    </option>
                                ))}
                            </select>
                        </>
                    )
                }
                <div className="actions">
                    <button className="cancel" onClick={() => setShowAddConnection(false)}>Cancel</button>
                    <button className="confirm" onClick={() => handleAddConnection({
                        nodeDetails,
                        connectionSource,
                        connectionTarget,
                        connectionLabel,
                        connectionDirection,
                        connectionLevel,
                        editingEdgeId,
                        setEditingEdgeId,
                        setConnectionSource,
                        setConnectionTarget,
                        setConnectionLabel,
                        setConnectionDirection,
                        setApplyMode,
                        setShowAddConnection,
                        setGraphData,
                        networkRef,
                        timelineEntries,
                        setTimelineEntries,
                        applyMode,
                        selectedSnapshotIndex,
                        partialStartIndex,
                        partialEndIndex
                    })}>Add</button>
                </div>
            </div >
        </div >
    )
}
