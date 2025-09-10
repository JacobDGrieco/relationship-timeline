import { createSnapshot, getNowDateTime } from "../../utils/timelineHelpers";

export default function AddTimelineEntryPopup({
    entryText,
    setEntryText,
    entryType,
    setEntryType,
    entryDate,
    setEntryDate,
    entryTime,
    setEntryTime,
    networkRef,
    graphData,
    nodeDetails,
    setTimelineEntries,
    editingTickId,
    setEditingTickId,
    setSnapshots,
    setShowTimelinePopup,
    timelineEntries,
    setSelectedSnapshotIndex
}) {
    return (
        <div className="popup-overlay">
            <div className="popup">
                <h2>{editingTickId != null ? "Edit Event" : "Add Event"}</h2>
                <label>Event Name</label>
                <input
                    type="text"
                    value={entryText}
                    onChange={(e) => setEntryText(e.target.value)}
                    placeholder="e.g. Character Introduced"
                />
                <label>Type</label>
                <div className="buttons" style={{ display: 'flex', gap: '1rem' }}>
                    <label>
                        <input
                            type="radio"
                            value="event"
                            checked={entryType === "event"}
                            onChange={() => setEntryType("event")}
                        />
                        Event
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="subevent"
                            checked={entryType === "subevent"}
                            onChange={() => setEntryType("subevent")}
                        />
                        Subevent
                    </label>
                </div>
                <label>Date</label>
                <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                />
                <label>Time</label>
                <input
                    type="time"
                    value={entryTime}
                    onChange={(e) => setEntryTime(e.target.value)}
                />
                <div className="actions">
                    <button className="cancel" onClick={() => setShowTimelinePopup(false)}>Cancel</button>
                    <button className="confirm" onClick={() => {
                        if (!entryText.trim() || !entryDate) return;
                        const timestamp = new Date(`${entryDate}T${entryTime || "00:00"}`).toISOString();
                        const isEditing = editingTickId != null && editingTickId >= 0 && editingTickId < timelineEntries.length;
                        const baseSnapshot = isEditing ? timelineEntries[editingTickId].snapshot
                            : createSnapshot(networkRef, graphData, nodeDetails);
                        const updatedEntry = { type: entryType, name: entryText, timestamp, snapshot: baseSnapshot };

                        let updated = [...timelineEntries];
                        if (isEditing) {
                            updated[editingTickId] = updatedEntry;  // replace in place
                        } else {
                            updated.push(updatedEntry);             // brand-new entry
                        }
                        // keep entries ordered by time
                        updated.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                        // where did our updated entry land?
                        const newIndex = updated.findIndex(e => e === updatedEntry);

                        setTimelineEntries(updated);
                        if (!isEditing) {
                            // only store a new snapshot when creating
                            setSnapshots(prev => [...prev, baseSnapshot]);
                        }
                        if (newIndex !== -1) setSelectedSnapshotIndex(newIndex);

                        // reset form & close
                        const { date, time } = getNowDateTime();
                        setShowTimelinePopup(false);
                        setEntryText("");
                        setEntryType("event");
                        setEntryDate(date);
                        setEntryTime(time);
                        setEditingTickId?.(null);
                    }}>{editingTickId != null ? "Edit Event" : "Add Event"}</button>
                </div>
            </div>
        </div>
    )
}