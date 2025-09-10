import { handleUpdateSnapshots } from "./timelineHelpers";

export function handleAddConnection({
    nodeDetails,
    connectionSource,
    connectionTarget,
    connectionLabel,
    connectionDirection,
    connectionLevel,
    editingEdgeId,
    setEditingEdgeId,
    setGraphData,
    networkRef,
    timelineEntries,
    setTimelineEntries,
    applyMode,
    selectedSnapshotIndex,
    partialStartIndex,
    partialEndIndex,
    clearPopup
}) {
    const allNodeDetails = Object.entries(nodeDetails);

    const sourceEntry = allNodeDetails.find(([, data]) => data.name === connectionSource);
    const targetEntry = allNodeDetails.find(([, data]) => data.name === connectionTarget);

    if (!sourceEntry || !targetEntry) {
        alert('One or both node names not found.');
        return;
    }

    const fromId = sourceEntry[0];
    const toId = targetEntry[0];

    const updatedEdge = {
        from: fromId,
        to: toId,
        label: connectionLabel,
        arrows: getArrowDirection(connectionDirection),
        level: connectionLevel
    };

    if (editingEdgeId) {
        updatedEdge.id = editingEdgeId;
        networkRef.current.body.data.edges.update(updatedEdge);

        setGraphData(prev => ({
            ...prev,
            edges: prev.edges.map(edge =>
                edge.id === editingEdgeId ? { ...updatedEdge } : edge
            )
        }));
        setEditingEdgeId(null);
    } else {
        const id = generateUniqueID();
        updatedEdge.id = id;

        networkRef.current.body.data.edges.add(updatedEdge);

        setGraphData(prev => ({
            ...prev,
            edges: [...prev.edges, updatedEdge]
        }));
    }

    handleUpdateSnapshots(updatedEdge, 'edge', {
        applyMode,
        selectedSnapshotIndex,
        partialStartIndex,
        partialEndIndex,
        timelineEntries,
        setTimelineEntries,
        networkRef,
        nodeDetails
    });

    clearPopup();
};

export function handleDeleteEdge(networkRef, edgeId, setGraphData, setShowEdgePopup, setSelectedEdgeId) {
    networkRef.current.body.data.edges.remove({ id: edgeId });

    setGraphData(prev => ({
        nodes: [...prev.nodes],
        edges: prev.edges.filter(edge => edge.id !== edgeId)
    }));

    setShowEdgePopup(false);
    setSelectedEdgeId(null);
}

export function generateUniqueID() {
    return 'node-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function getArrowDirection(direction) {
    switch (direction) {
        case 'normal':
            return { to: { enabled: true } };
        case 'reverse':
            return { from: { enabled: true } };
        case 'both':
            return { to: { enabled: true }, from: { enabled: true } };
        case 'none':
        default:
            return { to: { enabled: false }, from: { enabled: false } };
    }
}

export function getArrowDirectionLabel(arrows) {
    const from = arrows?.from?.enabled;
    const to = arrows?.to?.enabled;

    if (from && to) return 'both';
    if (from) return 'reverse';
    if (to) return 'normal';
    return 'none';
}