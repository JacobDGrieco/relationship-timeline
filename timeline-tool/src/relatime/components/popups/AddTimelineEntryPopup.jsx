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
    setSnapshots,
    setShowTimelinePopup,
    timelineEntries,
    setSelectedSnapshotIndex
}) {
    return (
        <div className="popup-overlay">
            <div className="popup">
                <h2>Add Event</h2>
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
                        const snapshot = createSnapshot(networkRef, graphData, nodeDetails);
                        const updated = [...timelineEntries, { type: entryType, text: entryText, timestamp, snapshot }];
                        const newIndex = updated.findIndex(e => e.timestamp === timestamp && e.text === entryText);
                        const { date, time } = getNowDateTime();

                        setTimelineEntries(updated);
                        setSnapshots(prev => [...prev, snapshot]);
                        if (newIndex !== -1) {
                            setSelectedSnapshotIndex(newIndex);
                        }

                        setShowTimelinePopup(false);
                        setEntryText("");
                        setEntryType("event");
                        setEntryDate(date);
                        setEntryTime(time);
                    }}>Add Entry</button>
                </div>
            </div>
        </div>
    )
}