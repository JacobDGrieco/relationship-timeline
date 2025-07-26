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
                <label>Source Name</label>
                <input
                    type="text"
                    value={connectionSource}
                    onChange={(e) => setConnectionSource(e.target.value)}
                    placeholder="Enter source node name"
                />
                <label>Target Name</label>
                <input
                    type="text"
                    value={connectionTarget}
                    onChange={(e) => setConnectionTarget(e.target.value)}
                    placeholder="Enter target node name"
                />
                <label>Connection Name (Label)</label>
                <input
                    type="text"
                    value={connectionLabel}
                    onChange={(e) => setConnectionLabel(e.target.value)}
                    placeholder="Optional label"
                />
                <label>Direction</label>
                <div className="connection-direction">
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
                <div className="connection-level">
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
                {applyMode === 'partial' && (
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
                )}
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
            </div>
        </div>
    )
}
