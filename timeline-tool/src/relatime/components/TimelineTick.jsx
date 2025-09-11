import { getLeftOffset, formatDateTime } from '../utils/timelineHelpers.jsx';

export default function TimelineTick({
    idx,
    entry,
    startTime,
    stopTime,
    fullWidth,
    stackMap,
    setGraphData,
    setNodeDetails,
    selectedSnapshotIndex,
    setSelectedSnapshotIndex,
    setSelectedTickIndex,
    setHoveredTick,
    setContextTarget,
    setContextMenuPosition,
    setShowContextMenu,
    networkRef,
    nodesRef,
    setIsDetailsVisible,
    setJustClosedRecently
}) {
    const entryTime = new Date(entry.timestamp).getTime();
    const leftPx = getLeftOffset(entry.timestamp, startTime, stopTime, fullWidth);
    const stackKey = entry.timestamp;
    stackMap[stackKey] = (stackMap[stackKey] || 0) + 1;
    const inView = entryTime >= startTime && entryTime <= stopTime;

    const handleClick = () => {
        // Close NodeDetailsPanel
        setIsDetailsVisible(false);
        setJustClosedRecently(false);

        // When a tick is clicked, update state to make this tick the selected one.
        setSelectedSnapshotIndex(idx);

        // Update the graph to reflect this snapshot
        const snapshot = entry.snapshot;
        setGraphData(snapshot.graphData);
        setNodeDetails(snapshot.nodeDetails);

        // Update the network/vis data
        nodesRef.current.clear();
        nodesRef.current.add(snapshot.graphData.nodes);
        networkRef.current.body.data.edges.clear();
        networkRef.current.body.data.edges.add(snapshot.graphData.edges);
    };

    const handleRightClick = (e) => {
        e.preventDefault();
        setSelectedTickIndex(idx);
        setContextTarget({ type: 'tick', id: idx });
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
    };

    if (!inView) return null;

    return (
        <div
            key={idx}
            className={`timeline-tick ${entry.type} ${idx === selectedSnapshotIndex ? "active" : ""}`}
            style={{ left: `${leftPx}px`, opacity: inView ? 1 : 0.15, pointerEvents: inView ? 'auto' : 'none' }}
            onClick={handleClick}
            onContextMenu={handleRightClick}
            onMouseEnter={() => { setHoveredTick({ left: leftPx, time: formatDateTime(entry.timestamp) }); }}
            onMouseLeave={() => { setHoveredTick(null); }}
        >
            <div className="tick-line" />
            <div className="tick-label">{entry.name}</div>
        </div>
    );
}