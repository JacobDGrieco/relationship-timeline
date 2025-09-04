import { handleAddPerson } from "../../utils/nodeHelpers"

export default function AddNodePopup({
  personName,
  setPersonName,
  networkRef,
  nodesRef,
  nodeDetails,
  setGraphData,
  setNodeDetails,
  setConnectionLabel,
  setConnectionDirection,
  setShowAddPerson,
  timelineEntries,
  selectedSnapshotIndex,
  setTimelineEntries,
  applyMode,
  setApplyMode,
  partialStartIndex,
  setPartialStartIndex,
  partialEndIndex,
  setPartialEndIndex,
  projectSettings,
  nodeType,
  setNodeType
}) {
  const typeOptions = (projectSettings?.nodeTypes?.length ? projectSettings.nodeTypes : ["Default"]);

  // Build options for dropdowns
  const pastEvents = timelineEntries
    .map((entry, idx) => ({ idx, entry }))
    .filter(({ idx }) => idx <= selectedSnapshotIndex)
    .sort((a, b) => b.idx - a.idx); // descending by distance

  const futureEvents = timelineEntries
    .map((entry, idx) => ({ idx, entry }))
    .filter(({ idx }) => idx >= selectedSnapshotIndex)
    .sort((a, b) => a.idx - b.idx); // ascending by distance

  return (
    <div className="popup-overlay">
      <div className="popup">
        <h2>Add Node</h2>
        <label>Name</label>
        <input type="text" value={personName} onChange={(e) => setPersonName(e.target.value)} />
        <label>Node Type</label>
        <select
          value={nodeType || typeOptions[0]}
          onChange={(e) => setNodeType(e.target.value)}
          required
        >
          {typeOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
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
                  {entry.text} — {new Date(entry.timestamp).toLocaleString()}
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
                  {entry.text} — {new Date(entry.timestamp).toLocaleString()}
                </option>
              ))}
            </select>
          </>
        )}
        <div className="actions">
          <button className="cancel" onClick={() => setShowAddPerson(false)}>Cancel</button>
          <button className="confirm" onClick={() => handleAddPerson({
            personName,
            nodesRef,
            setGraphData,
            setNodeDetails,
            setPersonName,
            setConnectionLabel,
            setConnectionDirection,
            setApplyMode,
            setShowAddPerson,
            timelineEntries,
            setTimelineEntries,
            applyMode,
            selectedSnapshotIndex,
            partialStartIndex,
            partialEndIndex,
            networkRef,
            nodeDetails,
            projectSettings,
            nodeType: (nodeType || typeOptions[0] || "Default")
          })}>Add</button>
        </div>
      </div>
    </div >
  )
}