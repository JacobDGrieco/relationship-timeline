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

export function handleUpdateSnapshots(item, type, {
  applyMode,
  selectedSnapshotIndex,
  partialStartIndex,
  partialEndIndex,
  timelineEntries,
  setTimelineEntries,
  networkRef,
  nodeDetails
}) {
  if (applyMode === 'none') {
    if (selectedSnapshotIndex !== null && timelineEntries[selectedSnapshotIndex]) {
      const safeNodeDetails = nodeDetails ? JSON.parse(JSON.stringify(nodeDetails)) : {};

      const updated = [...timelineEntries];
      updated[selectedSnapshotIndex].snapshot = {
        graphData: {
          nodes: networkRef.current.body.data.nodes.get(),
          edges: networkRef.current.body.data.edges.get(),
        },
        nodeDetails: safeNodeDetails
      };
      setTimelineEntries(updated);
    }
    return;
  }

  const updated = [...timelineEntries];

  const applyToIndex = (idx) => {
    const snap = updated[idx].snapshot;
    if (type === 'node') {
      // avoid duplicates if needed
      if (!snap.graphData.nodes.some(n => n.id === item.id)) {
        snap.graphData.nodes = [...snap.graphData.nodes, { ...item }];
      }
    } else if (type === 'edge') {
      if (!snap.graphData.edges.some(e => e.id === item.id)) {
        snap.graphData.edges = [...snap.graphData.edges, { ...item }];
      }
    }
  };

  if (applyMode === 'full') {
    updated.forEach((_, idx) => applyToIndex(idx));
  } else if (applyMode === 'forward') {
    for (let i = selectedSnapshotIndex + 1; i < updated.length; i++) {
      applyToIndex(i);
    }
  } else if (applyMode === 'backward') {
    for (let i = selectedSnapshotIndex; i >= 0; i--) {
      applyToIndex(i);
    }
  } else if (applyMode === 'partial') {
    if (partialStartIndex != null && partialEndIndex != null) {
      const start = Math.min(partialStartIndex, partialEndIndex);
      const end = Math.max(partialStartIndex, partialEndIndex);
      for (let i = start; i <= end; i++) {
        applyToIndex(i);
      }
    }
  }

  setTimelineEntries(updated);
}
