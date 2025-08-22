// NodeContextMenu.jsx
import { handleDeleteNode } from '../../utils/nodeHelpers.jsx';

export default function NodeContextMenu({
  nodePopupPosition,
  selectedNode,
  setSelectedNode,
  setIsDetailsVisible,
  setShowNodePopup,
  setShowEdgePopup,
  setGraphData,
  networkRef
}) {
  if (!selectedNode) return null;

  return (
    <div
      className="context-menu"
      style={{ top: nodePopupPosition.y, left: nodePopupPosition.x }}
    >
      <button
        onClick={() => {
          // Open the details panel like a normal node click
          setIsDetailsVisible(true);
          setShowNodePopup(false);
          setShowEdgePopup(false);
        }}
      >
        Edit
      </button>

      <button
        className="delete-button"
        onClick={() => {
          handleDeleteNode(networkRef, selectedNode, setGraphData);
          setShowNodePopup(false);
          setIsDetailsVisible(false);
          setSelectedNode(null);
        }}
      >
        Delete
      </button>
    </div>
  );
}
