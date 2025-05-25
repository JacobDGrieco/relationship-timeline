export default function AddConnectionPopup({
  connectionSource,
  setConnectionSource,
  connectionTarget,
  setConnectionTarget,
  connectionLabel,
  setConnectionLabel,
  connectionDirection,
  setConnectionDirection,
  setShowAddConnection,
  handleAddConnection
}) {
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
                <div className="actions">
                    <button className="cancel" onClick={() => setShowAddConnection(false)}>Cancel</button>
                    <button className="confirm" onClick={handleAddConnection}>Add</button>
                </div>
            </div>
        </div>
    )
}
