import { createSnapshot, getLeftOffset, formatDateTime } from "../utils/timelineHelpers.jsx";

export default function TimelineTick({
	cytoRef,
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
	timelineEntries,
	setTimelineEntries,
	graphData,
	nodeDetails,
	setSelectedTickIndex,
	setHoveredTick,
	setContextTarget,
	setContextMenuPosition,
	setShowContextMenu,
	nodesRef,
	setIsDetailsVisible,
	setJustClosedRecently,
}) {
	const entryTime = new Date(entry.timestamp).getTime();
	const leftPx = getLeftOffset(entry.timestamp, startTime, stopTime, fullWidth);
	const stackKey = entry.timestamp;
	stackMap[stackKey] = (stackMap[stackKey] || 0) + 1;
	const inView = entryTime >= startTime && entryTime <= stopTime;

	const handleClick = () => {
		// 1) Save the current event's live state (positions, details, etc.)
		if (typeof selectedSnapshotIndex === "number" && selectedSnapshotIndex !== idx && timelineEntries?.[selectedSnapshotIndex]) {
			const fresh = createSnapshot(graphData, nodeDetails, { cytoRef });
			setTimelineEntries((prev) => {
				const copy = [...prev];
				copy[selectedSnapshotIndex] = { ...copy[selectedSnapshotIndex], snapshot: fresh };
				return copy;
			});
		}

		// 2) Switch to the clicked event
		setIsDetailsVisible(false);
		setJustClosedRecently(false);
		setSelectedSnapshotIndex(idx);

		// Update the graph to reflect this snapshot
		const snapshot = entry.snapshot;
		setGraphData(snapshot.graphData);
		setNodeDetails(snapshot.nodeDetails);
	};

	const handleRightClick = (e) => {
		if (e.clientY > 675) {
			e.clientY -= 75;
		}
		e.preventDefault();
		setSelectedTickIndex(idx);
		setContextTarget({ type: "tick", id: idx });
		setContextMenuPosition({ x: e.clientX, y: e.clientY });
		setShowContextMenu(true);
	};

	if (!inView) return null;

	return (
		<div
			key={idx}
			className={`timeline-tick ${entry.type} ${idx === selectedSnapshotIndex ? "active" : ""}`}
			style={{ left: `${leftPx}px`, opacity: inView ? 1 : 0.15, pointerEvents: inView ? "auto" : "none" }}
			onClick={handleClick}
			onContextMenu={handleRightClick}
			onMouseEnter={() => {
				setHoveredTick({ left: leftPx, time: formatDateTime(entry.timestamp) });
			}}
			onMouseLeave={() => {
				setHoveredTick(null);
			}}
		>
			<div className="tick-line" />
			<div className="tick-label">{entry.name}</div>
		</div>
	);
}
