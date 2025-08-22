// ContextMenu.jsx
import { getArrowDirectionLabel, handleDeleteEdge } from '../../utils/graphHelpers.jsx';
import { handleDeleteNode } from '../../utils/nodeHelpers.jsx';

export default function ContextMenu({
  position,          // {x,y} in viewport coords
  target,            // { type: 'node'|'edge', id: string }
  networkRef,
  // Edge edit plumbing:
  nodeDetails,
  setConnectionSource,
  setConnectionTarget,
  setConnectionLabel,
  setConnectionDirection,
  setEditingEdgeId,
  setShowAddConnection,
  // Shared/close:
  setShowContextMenu,
  // Node edit plumbing:
  setIsDetailsVisible,
  setSelectedNode,
  // State updaters:
  setGraphData,
}) {
  if (!target) return null;

  const onEdit = () => {
    if (target.type === 'edge') {
      const edge = networkRef.current.body.data.edges.get(target.id);
      const sourceName = nodeDetails[edge.from]?.name || '';
      const targetName = nodeDetails[edge.to]?.name || '';
      setConnectionSource(sourceName);
      setConnectionTarget(targetName);
      setConnectionLabel(edge.label || '');
      setConnectionDirection(getArrowDirectionLabel(edge.arrows));
      setEditingEdgeId(target.id);
      setShowAddConnection(true);
      setShowContextMenu(false);
    } else if (target.type === 'node') {
      setSelectedNode(target.id);
      setIsDetailsVisible(true);
      setShowContextMenu(false);
    }
  };

  const onDelete = () => {
    if (target.type === 'edge') {
      handleDeleteEdge(networkRef, target.id, setGraphData, setShowContextMenu, () => {});
    } else if (target.type === 'node') {
      handleDeleteNode(networkRef, target.id, setGraphData);
      // Clear selection & close
      setSelectedNode?.(null);
      setIsDetailsVisible?.(false);
      setShowContextMenu(false);
    }
  };

  return (
    <div
      className="context-menu" // reuse your existing styles
      style={{ top: position.y, left: position.x }}
    >
      <button onClick={onEdit}>Edit</button>
      <button className="delete-button" onClick={onDelete}>Delete</button>
    </div>
  );
}
