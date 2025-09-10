// ContextMenu.jsx
import { getArrowDirectionLabel, handleDeleteEdge } from '../../utils/graphHelpers.jsx';
import { handleDeleteNode } from '../../utils/nodeHelpers.jsx';
import { formatTime } from '../../utils/timelineHelpers.jsx';

/** Node-only menu */
export function NodeContextMenu({
  position, setShowContextMenu, networkRef, nodeId,
  setSelectedNode, setIsDetailsVisible, setGraphData,
}) {
  if (!nodeId) return null;

  const onEdit = () => {
    setSelectedNode(nodeId);
    setIsDetailsVisible(true);
    setShowContextMenu(false);
  };

  const onDelete = () => {
    handleDeleteNode(networkRef, nodeId, setGraphData);
    setSelectedNode?.(null);
    setIsDetailsVisible?.(false);
    setShowContextMenu(false);
  };

  return (
    <div className="context-menu" style={{ top: position.y, left: position.x }}>
      <button onClick={onEdit}>Edit</button>
      <button className="delete-button" onClick={onDelete}>Delete</button>
    </div>
  );
}

/** Edge-only menu */
export function EdgeContextMenu({
  position, networkRef, setShowContextMenu, edgeId, nodeDetails,
  setEditingEdgeId, setShowAddConnection, setConnectionSource,
  setConnectionTarget, setConnectionLabel, setConnectionDirection,
  setGraphData,
}) {
  if (!edgeId) return null;

  const onEdit = () => {
    const edge = networkRef.current.body.data.edges.get(edgeId);
    const sourceName = nodeDetails[edge.from]?.name || '';
    const targetName = nodeDetails[edge.to]?.name || '';
    setConnectionSource(sourceName);
    setConnectionTarget(targetName);
    setConnectionLabel(edge.label || '');
    setConnectionDirection(getArrowDirectionLabel(edge.arrows));
    setEditingEdgeId(edgeId);
    setShowAddConnection(true);
    setShowContextMenu(false);
  };

  const onDelete = () => {
    handleDeleteEdge(networkRef, edgeId, setGraphData, setShowContextMenu, () => { });
  };

  return (
    <div className="context-menu" style={{ top: position.y, left: position.x }}>
      <button onClick={onEdit}>Edit</button>
      <button className="delete-button" onClick={onDelete}>Delete</button>
    </div>
  );
}

/** Tick-only menu */
export function TickContextMenu({
  position, setShowContextMenu, tickId, timelineEntries, setTimelineEntries,
  setEditingTickId, snapshotId, setSnapshotId, setShowTimelinePopup,
  setEntryText, setEntryType, setEntryDate, setEntryTime,
}) {
  if (!(tickId + 1)) return null;

  const onEditTick = () => {
    const tick = timelineEntries[tickId];
    if (!tick) return;

    const dateObj = new Date(tick.timestamp);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');

    setEntryText(tick.name || '');
    setEntryType(tick.type);
    setEntryDate(`${yyyy}-${mm}-${dd}`);
    setEntryTime(formatTime(tick.timestamp));
    setEditingTickId?.(tickId);
    setShowTimelinePopup(true);
    setShowContextMenu(false);
  };

  const onDeleteTick = () => {
    const updated = [...timelineEntries];
    updated.splice(tickId, 1);
    setTimelineEntries(updated);
    setShowContextMenu(false);
    if (snapshotId === tickId) setSnapshotId(null);
  };

  const onEdit = () => { onEditTick?.(tickId); setShowContextMenu(false); };
  const onDelete = () => {
    onDeleteTick?.(tickId); setShowContextMenu(false);
  };

  return (
    <div className="context-menu" style={{ top: position.y, left: position.x }}>
      <button onClick={onEdit}>Edit</button>
      <button className="delete-button" onClick={onDelete}>Delete</button>
    </div>
  );
}