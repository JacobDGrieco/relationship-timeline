import { handleAddPerson } from "../../utils/nodeHelpers"

export default function AddNodePopup({
  personName,
  setPersonName,
  personSeries,
  setPersonSeries,
  SERIES_OPTIONS,
  nodesRef,
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
  setPartialEndIndex
}) {

  //console.log("AddNodePopup props:", { applyMode, setApplyMode });
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
        <label>Series</label>
        <select
          value={personSeries}
          onChange={(e) => setPersonSeries(e.target.value)}
          className="popup-dropdown"
        >
          <option value="">Select a series</option>
          {SERIES_OPTIONS.map((series) => (
            <option key={series} value={series}>
              {series}
            </option>
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
                  {entry.text}
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
                  {entry.text}
                </option>
              ))}
            </select>
          </>
        )}
        <div className="actions">
          <button className="cancel" onClick={() => setShowAddPerson(false)}>Cancel</button>
          <button className="confirm" onClick={() => handleAddPerson({
            personName,
            personSeries,
            nodesRef,
            setGraphData,
            setNodeDetails,
            setPersonName,
            setPersonSeries,
            setConnectionLabel,
            setConnectionDirection,
            setApplyMode,
            setShowAddPerson,
            timelineEntries,
            setTimelineEntries,
            applyMode,
            selectedSnapshotIndex,
            partialStartIndex,
            partialEndIndex
          })}>Add</button>
        </div>
      </div>
    </div >
  )
}