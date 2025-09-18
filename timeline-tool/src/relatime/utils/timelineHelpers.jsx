export function getLeftOffset(timestamp, startTime, endTime, fullWidth) {
	const entryTime = new Date(timestamp).getTime();
	const range = endTime - startTime || 1;
	return ((entryTime - startTime) / range) * (fullWidth - 100) + 25;
}

export function formatDateTime(timestamp) {
	const date = new Date(timestamp);
	const options = {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	};

	return date.toLocaleString(undefined, options).replace(",", " -");
}

export function formatTime(timestamp) {
	const date = new Date(timestamp);
	const options = {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	};
	return date.toLocaleTimeString(undefined, options);
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

export function createSnapshot(graphData, nodeDetails, { cytoRef } = {}) {
	const safeNodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
	const safeEdges = Array.isArray(graphData?.edges) ? graphData.edges : [];
	// If we have a Cytoscape instance, capture current positions
	const nodesWithPos = cytoRef?.current
		? safeNodes.map((n) => {
				const ele = cytoRef.current.$id(String(n.id));
				if (ele && ele.nonempty && ele.nonempty()) {
					const p = ele.position();
					return { ...n, x: p.x, y: p.y };
				}
				return n;
		  })
		: safeNodes;
	const normalizedEdges = safeEdges.map((e) => ({
		...e,
		source: String(e.source ?? e.from),
		target: String(e.target ?? e.to),
	}));
	const safeDetails = nodeDetails && typeof nodeDetails === "object" ? nodeDetails : {};
	return {
		graphData: {
			nodes: JSON.parse(JSON.stringify(nodesWithPos)),
			edges: JSON.parse(JSON.stringify(normalizedEdges)),
		},
		nodeDetails: JSON.parse(JSON.stringify(safeDetails)),
	};
}

export function handleAddTick({
	cytoRef,
	graphData,
	entryText,
	entryType,
	entryDate,
	entryTime,
	editingTickId,
	timelineEntries,
	setTimelineEntries,
	nodeDetails,
	setSnapshots,
	setSelectedSnapshotIndex,
	clearPopup,
}) {
	if (!entryText.trim() || !entryDate) return;
	const timestamp = new Date(`${entryDate}T${entryTime || "00:00"}`).toISOString();
	const isEditing = editingTickId != null && editingTickId >= 0 && editingTickId < timelineEntries.length;
	const baseSnapshot = isEditing ? timelineEntries[editingTickId].snapshot : createSnapshot(graphData, nodeDetails, { cytoRef });
	const updatedEntry = { type: entryType, name: entryText, timestamp, snapshot: baseSnapshot };

	let updated = [...timelineEntries];
	if (isEditing) {
		updated[editingTickId] = updatedEntry; // replace in place
	} else {
		updated.push(updatedEntry); // brand-new entry
	}
	// keep entries ordered by time
	updated.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

	// where did our updated entry land?
	const newIndex = updated.findIndex((e) => e === updatedEntry);

	setTimelineEntries(updated);
	if (!isEditing) {
		// only store a new snapshot when creating
		setSnapshots((prev) => [...prev, baseSnapshot]);
	}
	if (newIndex !== -1) setSelectedSnapshotIndex(newIndex);

	clearPopup();
}

export function handleUpdateSnapshots(
	item,
	type,
	{ applyMode, selectedSnapshotIndex, partialStartIndex, partialEndIndex, timelineEntries, setTimelineEntries, nodeDetails }
) {
	const updated = [...timelineEntries];
	const applyToIndex = (idx) => {
		const snap = updated[idx].snapshot;

		// Guards
		if (!snap.graphData) snap.graphData = { nodes: [], edges: [] };
		if (!snap.nodeDetails) snap.nodeDetails = {};

		if (type === "node") {
			const exists = snap.graphData.nodes.some((n) => n.id === item.id);
			snap.graphData.nodes = exists
				? snap.graphData.nodes.map((n) => (n.id === item.id ? { ...n, ...item } : n))
				: [...snap.graphData.nodes, { ...item }];

			const detailFromCaller = nodeDetails?.[item.id];
			const mergedDetail = detailFromCaller || { name: item.label, type: item.type || "Default" };
			snap.nodeDetails[item.id] = { ...(snap.nodeDetails[item.id] || {}), ...mergedDetail };
		} else if (type === "edge") {
			const exists = snap.graphData.edges.some((e) => e.id === item.id);
			snap.graphData.edges = exists
				? snap.graphData.edges.map((e) => (e.id === item.id ? { ...e, ...item } : e))
				: [...snap.graphData.edges, { ...item }];
		}
	};

	switch (applyMode) {
		case "none": {
			if (selectedSnapshotIndex != null && updated[selectedSnapshotIndex]) {
				// Overwrite current snapshot by merging the change into its existing snapshot
				const snap = JSON.parse(
					JSON.stringify(updated[selectedSnapshotIndex].snapshot || { graphData: { nodes: [], edges: [] }, nodeDetails: {} })
				);
				// Reuse same merge logic against this one index
				const one = [{ snapshot: snap }];
				const tmp = { ...item }; // make a shallow copy
				const mergeCtx = { applyMode: "full", selectedSnapshotIndex: 0, timelineEntries: one, setTimelineEntries: () => {}, nodeDetails };
				// inline apply (same as applyToIndex but against `snap`)
				if (type === "node") {
					const exists = snap.graphData.nodes.some((n) => n.id === tmp.id);
					snap.graphData.nodes = exists
						? snap.graphData.nodes.map((n) => (n.id === tmp.id ? { ...n, ...tmp } : n))
						: [...snap.graphData.nodes, { ...tmp }];
					const detailFromCaller = nodeDetails?.[tmp.id];
					const mergedDetail = detailFromCaller || { name: tmp.label, type: tmp.type || "Default" };
					snap.nodeDetails[tmp.id] = { ...(snap.nodeDetails[tmp.id] || {}), ...mergedDetail };
				} else if (type === "edge") {
					const exists = snap.graphData.edges.some((e) => e.id === tmp.id);
					snap.graphData.edges = exists
						? snap.graphData.edges.map((e) => (e.id === tmp.id ? { ...e, ...tmp } : e))
						: [...snap.graphData.edges, { ...tmp }];
				}
				updated[selectedSnapshotIndex] = { ...updated[selectedSnapshotIndex], snapshot: snap };
			}
			break;
		}
		case "full":
			updated.forEach((_, i) => applyToIndex(i));
			break;
		case "forward":
			if (selectedSnapshotIndex != null) {
				for (let i = selectedSnapshotIndex; i < updated.length; i++) applyToIndex(i);
			}
			break;
		case "backward":
			if (selectedSnapshotIndex != null) {
				for (let i = selectedSnapshotIndex; i >= 0; i--) applyToIndex(i);
			}
			break;
		case "partial": {
			if (partialStartIndex != null && partialEndIndex != null) {
				const start = Math.min(partialStartIndex, partialEndIndex);
				const end = Math.max(partialStartIndex, partialEndIndex);
				for (let i = start; i <= end; i++) applyToIndex(i);
			}
			break;
		}
		default:
			break;
	}

	setTimelineEntries(updated);
}
