import { getLeftOffset, formatDateTime } from '../utils/timelineHelpers.jsx';

export default function TimelineTick({
    idx,
    entry,
    startTime,
    stopTime,
    fullWidth,
    stackMap,
    lastActiveTickRef,
    setGraphData,
    setNodeDetails,
    setSelectedSnapshotIndex,
    setSelectedTickIndex,
    setHoveredTick,
    setTickContextMenuPosition,
    setShowTickContextMenu,
    networkRef,
    nodesRef
}) {
    const entryTime = new Date(entry.timestamp).getTime();
    const leftPx = getLeftOffset(entry.timestamp, startTime, stopTime, fullWidth);
    const stackKey = entry.timestamp;
    stackMap[stackKey] = (stackMap[stackKey] || 0) + 1;
    const inView = entryTime >= startTime && entryTime <= stopTime;

    const handleClick = () => {
        if (lastActiveTickRef.current !== null) {
            const lastActive = document.querySelector(`.timeline-tick.active`);
            if (lastActive) lastActive.classList.remove('active');
        }

        const currentTick = document.querySelectorAll('.timeline-tick')[idx];
        if (currentTick) currentTick.classList.add('active');
        lastActiveTickRef.current = idx;

        const snapshot = entry.snapshot;
        setGraphData(snapshot.graphData);
        setNodeDetails(snapshot.nodeDetails);
        setSelectedSnapshotIndex(idx);
        nodesRef.current.clear();
        nodesRef.current.add(snapshot.graphData.nodes);
        networkRef.current.body.data.edges.clear();
        networkRef.current.body.data.edges.add(snapshot.graphData.edges);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        setSelectedTickIndex(idx);
        setTickContextMenuPosition({ x: e.clientX, y: e.clientY });
        setShowTickContextMenu(true);
    };

    if (!inView) return null;

    return (
        <div
            key={idx}
            className={`timeline-tick ${entry.type}`}
            style={{ left: `${leftPx}px`, opacity: inView ? 1 : 0.15, pointerEvents: inView ? 'auto' : 'none' }}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            onMouseEnter={() => { setHoveredTick({ left: leftPx, time: formatDateTime(entry.timestamp) }); }}
            onMouseLeave={() => { setHoveredTick(null); }}
        >
            <div className="tick-line" />
            <div className="tick-label">{entry.text}</div>
        </div>
    );
}