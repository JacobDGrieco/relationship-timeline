import { createSnapshot, getNowDateTime, handleAddTick } from "../../utils/timelineHelpers";

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
    const clearPopup = () => {
        const { date, time } = getNowDateTime();
        setEntryText("");
        setEntryType("event");
        setEntryDate(date);
        setEntryTime(time);
        setEditingTickId?.(null);
        setShowTimelinePopup(false);
    }

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
                    <button className="cancel" onClick={() => clearPopup()}>Cancel</button>
                    <button className="confirm" onClick={() => {
                        handleAddTick({
                            entryText,
                            entryType,
                            entryDate,
                            entryTime,
                            editingTickId,
                            timelineEntries,
                            setTimelineEntries,
                            networkRef,
                            graphData,
                            nodeDetails,
                            setSnapshots,
                            setSelectedSnapshotIndex,
                            clearPopup
                        })
                    }}>{editingTickId != null ? "Edit Event" : "Add Event"}</button>
                </div>
            </div>
        </div>
    )
}