export default function TickContextMenu({
    tickContextMenuPosition,
    selectedTickIndex,
    setTimelineEntries,
    timelineEntries,
    setShowTickContextMenu,
    selectedSnapshotIndex,
    setSelectedSnapshotIndex
}) {
    return (
        <div
            className="tick-context-menu"
            style={{
                position: 'absolute',
                top: tickContextMenuPosition.y,
                left: tickContextMenuPosition.x,
                borderRadius: '4px',
                zIndex: 20
            }}
        >
            <button
                onClick={() => {
                    const updated = [...timelineEntries];
                    updated.splice(selectedTickIndex, 1);
                    setTimelineEntries(updated);
                    setShowTickContextMenu(false);
                    if (selectedSnapshotIndex === selectedTickIndex) setSelectedSnapshotIndex(null);
                }}
                style={{ marginRight: '1rem' }}
            >Delete</button>
        </div>
    )
}