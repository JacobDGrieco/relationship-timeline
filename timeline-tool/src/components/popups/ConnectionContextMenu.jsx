import { getArrowDirectionLabel, deleteEdge } from '../../utils/graphHelpers.jsx';

export default function ConnectionContextMenu({
    edgePopupPosition,
    networkRef,
    selectedEdgeId,
    setConnectionSource,
    setConnectionTarget,
    setConnectionLabel,
    setConnectionDirection,
    setEditingEdgeId,
    setShowAddConnection,
    setShowEdgePopup,
    setGraphData,
    setSelectedEdgeId,
    nodeDetails
}) {
    return (
        <div className="edge-popup" style={{ top: edgePopupPosition.y, left: edgePopupPosition.x }}>
            <button onClick={() => {
                const edge = networkRef.current.body.data.edges.get(selectedEdgeId);
                const sourceName = nodeDetails[edge.from]?.name || '';
                const targetName = nodeDetails[edge.to]?.name || '';

                setConnectionSource(sourceName);
                setConnectionTarget(targetName);
                setConnectionLabel(edge.label || '');
                setConnectionDirection(getArrowDirectionLabel(edge.arrows));
                setEditingEdgeId(selectedEdgeId);
                setShowAddConnection(true);
                setShowEdgePopup(false);
            }}>Edit</button>
            <button className="delete-button" onClick={() => deleteEdge(networkRef, selectedEdgeId, setGraphData, setShowEdgePopup, setSelectedEdgeId)}>Delete</button>
        </div>
    )
}