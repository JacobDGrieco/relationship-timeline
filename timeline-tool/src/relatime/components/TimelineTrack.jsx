import { useMemo } from "react";
import TimelineRuler from "./TimelineRuler.jsx";
import TimelineTick from "./TimelineTick.jsx";
import { createSnapshot, getStartTime, getStopTime } from "../utils/timelineHelpers.jsx";

export default function TimelineTrack({
	timelineEntries,
	timelineStartDate,
	timelineEndDate,
	selectedSnapshotIndex,
	setSelectedSnapshotIndex,
	setGraphData,
	setNodeDetails,
	setTimelineEntries,
	graphData,
	nodeDetails,
	setSelectedTickIndex,
	setContextTarget,
	setContextMenuPosition,
	setShowContextMenu,
	setHoveredTick,
	cytoRef,
	nodesRef,
	lastActiveTickRef,
	timelineTrackRef,
	setIsDetailsVisible,
	setJustClosedRecently,
}) {
	const startTime = getStartTime(timelineStartDate);
	const stopTime = getStopTime(timelineEndDate);
	const fullWidth = timelineTrackRef.current?.offsetWidth || 1000;

	const stackMap = {};

	const timelineTicks = useMemo(() => {
		return timelineEntries.map((entry, idx) => (
			<TimelineTick
				key={idx}
				idx={idx}
				entry={entry}
				startTime={startTime}
				stopTime={stopTime}
				fullWidth={fullWidth}
				stackMap={stackMap}
				lastActiveTickRef={lastActiveTickRef}
				setGraphData={setGraphData}
				setNodeDetails={setNodeDetails}
				selectedSnapshotIndex={selectedSnapshotIndex}
				setSelectedSnapshotIndex={setSelectedSnapshotIndex}
				timelineEntries={timelineEntries}
				setTimelineEntries={setTimelineEntries}
				graphData={graphData}
				nodeDetails={nodeDetails}
				setSelectedTickIndex={setSelectedTickIndex}
				setHoveredTick={setHoveredTick}
				setContextTarget={setContextTarget}
				setContextMenuPosition={setContextMenuPosition}
				setShowContextMenu={setShowContextMenu}
				cytoRef={cytoRef}
				nodesRef={nodesRef}
				setIsDetailsVisible={setIsDetailsVisible}
				setJustClosedRecently={setJustClosedRecently}
			/>
		));
	}, [
		timelineEntries,
		startTime,
		stopTime,
		fullWidth,
		lastActiveTickRef,
		setGraphData,
		setNodeDetails,
		selectedSnapshotIndex,
		setSelectedSnapshotIndex,
		setTimelineEntries,
		graphData,
		nodeDetails,
		setSelectedTickIndex,
		setContextTarget,
		setContextMenuPosition,
		setShowContextMenu,
		cytoRef,
		nodesRef,
	]);

	return (
		<div className="timeline-track" ref={timelineTrackRef}>
			<TimelineRuler baseTime={startTime} endTime={stopTime} fullWidth={fullWidth} />
			{timelineTicks}
		</div>
	);
}
