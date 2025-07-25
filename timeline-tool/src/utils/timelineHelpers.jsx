export function getLeftOffset(timestamp, startTime, endTime, fullWidth) {
  const entryTime = new Date(timestamp).getTime();
  const range = endTime - startTime || 1;
  return ((entryTime - startTime) / range) * (fullWidth - 100) + 25;
}

export function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const options = {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };

  return date.toLocaleString(undefined, options).replace(',', ' -');
}

export function getNowDateTime() {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().slice(0, 5);
  return { date, time };
}

export function getStartTime(dateString) {
  return new Date(new Date(dateString).setHours(0, 0, 0, 0)).getTime();
}

export function getStopTime(dateString) {
  return new Date(new Date(dateString).setHours(23, 59, 59, 999)).getTime();
}

export function createSnapshot(networkRef, graphData, nodeDetails) {
  return {
    graphData: {
      nodes: networkRef.current.body.data.nodes.get(),
      edges: JSON.parse(JSON.stringify(graphData.edges)),
    },
    nodeDetails: JSON.parse(JSON.stringify(nodeDetails)),
  };
}

export function handleUpdateSnapshot({
  selectedSnapshotIndex,
  timelineEntries,
  setTimelineEntries,
  networkRef,
  nodeDetails
}) {
  if (selectedSnapshotIndex !== null && timelineEntries[selectedSnapshotIndex]) {
    const updated = [...timelineEntries];
    updated[selectedSnapshotIndex].snapshot = {
      graphData: {
        nodes: networkRef.current.body.data.nodes.get(),
        edges: networkRef.current.body.data.edges.get(),
      },
      nodeDetails: JSON.parse(JSON.stringify(nodeDetails))
    };
    setTimelineEntries(updated);
  }
};
