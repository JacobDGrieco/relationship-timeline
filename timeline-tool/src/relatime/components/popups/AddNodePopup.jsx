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
  setShowAddPerson
}) {
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
            setShowAddPerson
          })}>Add</button>
        </div>
      </div>
    </div >
  )
}