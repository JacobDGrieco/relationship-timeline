import { handleAddPerson } from "../../utils/nodeHelpers"

export default function AddNodePopup({
  personName,
  setPersonName,
  networkRef,
  nodesRef,
  nodeDetails,
  setGraphData,
  setNodeDetails,
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

  const clearPopup = () => {
    setPersonName('');
    setNodeType(typeOptions[0] || "Default");
    setApplyMode('none');
    setPartialStartIndex("--");
    setPartialEndIndex("--");
    setShowAddPerson(false);
  }

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
              {timelineEntries.map((entry, idx) => (
                <option key={idx} value={idx}>
                  {entry.name} — {new Date(entry.timestamp).toLocaleString()}
                </option>
              ))}
            </select>
            <label>Latest Event</label>
            <select
              value={partialEndIndex ?? ""}
              onChange={(e) => setPartialEndIndex(e.target.value ? parseInt(e.target.value, 10) : null)}
            >
              <option value="">--</option>
              {timelineEntries.map((entry, idx) => (
                <option key={idx} value={idx}>
                  {entry.name} — {new Date(entry.timestamp).toLocaleString()}
                </option>
              ))}
            </select>
          </>
        )}
        <div className="actions">
          <button className="cancel" onClick={() => clearPopup()}>Cancel</button>
          <button className="confirm" onClick={() => handleAddPerson({
            personName,
            nodesRef,
            setGraphData,
            setNodeDetails,
            timelineEntries,
            setTimelineEntries,
            applyMode,
            selectedSnapshotIndex,
            partialStartIndex,
            partialEndIndex,
            networkRef,
            nodeDetails,
            projectSettings,
            nodeType: (nodeType || typeOptions[0] || "Default"),
            clearPopup
          })}>Add</button>
        </div>
      </div>
    </div >
  )
}