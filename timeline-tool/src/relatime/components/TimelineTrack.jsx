import { useMemo } from 'react';
import TimelineRuler from './TimelineRuler.jsx'
import TimelineTick from './TimelineTick.jsx'
import { getStartTime, getStopTime } from '../utils/timelineHelpers.jsx'

export default function TimelineTrack({
  timelineEntries,
  timelineStartDate,
  timelineEndDate,
  selectedSnapshotIndex,
  setSelectedSnapshotIndex,
  setGraphData,
  setNodeDetails,
  setSelectedTickIndex,
  setTickContextMenuPosition,
  setShowTickContextMenu,
  setHoveredTick,
  networkRef,
  nodesRef,
  lastActiveTickRef,
  timelineTrackRef,
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
        setSelectedTickIndex={setSelectedTickIndex}
        setHoveredTick={setHoveredTick}
        setTickContextMenuPosition={setTickContextMenuPosition}
        setShowTickContextMenu={setShowTickContextMenu}
        networkRef={networkRef}
        nodesRef={nodesRef}
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
    setSelectedTickIndex,
    setTickContextMenuPosition,
    setShowTickContextMenu,
    networkRef,
    nodesRef,
  ]);

  return (
    <div className="timeline-track" ref={timelineTrackRef}>
      <TimelineRuler baseTime={startTime} endTime={stopTime} fullWidth={fullWidth} />
      {timelineTicks}
    </div>
  );
}