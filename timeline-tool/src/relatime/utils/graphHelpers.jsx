import { handleUpdateSnapshots } from "./timelineHelpers.jsx";

export function handleAddConnection({
	cytoRef,
	nodeDetails,
	connectionSource,
	connectionTarget,
	connectionLabel,
	connectionDirection,
	connectionLevel,
	editingEdgeId,
	setEditingEdgeId,
	setGraphData,
	timelineEntries,
	setTimelineEntries,
	applyMode,
	selectedSnapshotIndex,
	partialStartIndex,
	partialEndIndex,
	clearPopup,
}) {
	const allNodeDetails = Object.entries(nodeDetails);

	const sourceEntry = allNodeDetails.find(([, data]) => data.name === connectionSource);
	const targetEntry = allNodeDetails.find(([, data]) => data.name === connectionTarget);

	if (!sourceEntry || !targetEntry) {
		alert("One or both node names not found.");
		return;
	}

	const fromId = sourceEntry[0];
	const toId = targetEntry[0];

	const updatedEdge = {
		id: editingEdgeId || generateUniqueID("edge"),
		from: fromId, // kept for backward compatibility with snapshots
		to: toId, // kept for backward compatibility with snapshots
		source: fromId, // Cytoscape expects source/target
		target: toId,
		label: connectionLabel || "",
		direction: connectionDirection || "normal", // 'normal' | 'reverse' | 'both' | 'none'
		level: connectionLevel ?? 1, // 0=weak,1=normal,2=strong
	};

	if (editingEdgeId) {
		setGraphData((prev) => ({
			...prev,
			edges: prev.edges.map((e) => (e.id === editingEdgeId ? { ...e, ...updatedEdge } : e)),
		}));
		setEditingEdgeId(null);
	} else {
		setGraphData((prev) => ({ ...prev, edges: [...prev.edges, updatedEdge] }));
	}

	handleUpdateSnapshots(updatedEdge, "edge", {
		applyMode,
		selectedSnapshotIndex,
		partialStartIndex,
		partialEndIndex,
		timelineEntries,
		setTimelineEntries,
		nodeDetails,
	});

	clearPopup();
}

export function handleDeleteEdge(_cytoRef, edgeId, setGraphData, setShowEdgePopup, setSelectedEdgeId) {
	setGraphData((prev) => ({
		nodes: [...prev.nodes],
		edges: prev.edges.filter((edge) => edge.id !== edgeId),
	}));

	setShowEdgePopup(false);
	setSelectedEdgeId(null);
}

export function generateUniqueID(prefix = "id") {
	return `${prefix}-` + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function arrowShapesForDirection(direction = "normal") {
	switch (direction) {
		case "reverse":
			return { sourceArrow: "triangle", targetArrow: "none" };
		case "both":
			return { sourceArrow: "triangle", targetArrow: "triangle" };
		case "none":
			return { sourceArrow: "none", targetArrow: "none" };
		case "normal":
		default:
			return { sourceArrow: "none", targetArrow: "triangle" };
	}
}
