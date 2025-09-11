import { generateUniqueID } from "./graphHelpers";
import { handleUpdateSnapshots, createSnapshot } from "./timelineHelpers";

export function handleAddPerson({
  personName,
  nodesRef,
  setGraphData,
  setNodeDetails,
  timelineEntries,
  setTimelineEntries,
  applyMode,
  selectedSnapshotIndex,
  partialStartIndex,
  partialEndIndex,
  networkRef,
  nodeDetails,
  projectSettings,
  nodeType,
  clearPopup
}) {
  const id = generateUniqueID();
  const label = personName || `Node ${id}`;
  const newNode = { id, label, type: nodeType || "Default" };

  nodesRef.current.add(newNode);
  setGraphData(prev => ({
    nodes: [...prev.nodes, newNode],
    edges: [...prev.edges]
  }));

  const baseDetails = { name: personName, type: nodeType || "Default" };
  if (projectSettings?.length) {
    for (const field of projectSettings) {
      if (!(field?.id in baseDetails)) {
        baseDetails[f.id] =
          f.type === 'image-upload' ? null :
            (f.type === 'static-multiselect' || f.type === 'dynamic-multiselect') ? [] : '';
      }
    }
  }

  setNodeDetails(prev => {
    const next = { ...prev, [id]: baseDetails };
    handleUpdateSnapshots(newNode, 'node', {
      applyMode,
      selectedSnapshotIndex,
      partialStartIndex,
      partialEndIndex,
      timelineEntries,
      setTimelineEntries,
      networkRef,
      nodeDetails: next,
    });
    return next;
  });

  clearPopup();
}

// Remove a node and all its connected edges from graph + vis dataset
export function handleDeleteNode(networkRef, nodeId, setGraphData) {
  if (!networkRef?.current || !nodeId) return;

  const net = networkRef.current;
  const connectedEdgeIds = net.getConnectedEdges(nodeId) || [];

  // Remove from vis DataSets
  net.body.data.nodes.remove({ id: nodeId });
  connectedEdgeIds.forEach(eid => {
    net.body.data.edges.remove({ id: eid });
  });

  // Reflect in React graphData state
  setGraphData(prev => ({
    nodes: prev.nodes.filter(n => n.id !== nodeId),
    edges: prev.edges.filter(e => !connectedEdgeIds.includes(e.id) && e.from !== nodeId && e.to !== nodeId),
  }));
}

export function handleNodeFieldChange(nodeId, field, value, setNodeDetails) {
  setNodeDetails((prev) => ({
    ...prev,
    [nodeId]: {
      ...prev[nodeId],
      [field]: value,
    },
  }));
}

export function handleImageUpload(
  selectedNode,
  file,
  setNodeDetails,
  setGraphData,
  { networkRef, timelineEntries, setTimelineEntries, selectedSnapshotIndex } = {}
) {
  if (!file || !selectedNode) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const imageData = e.target.result;

    setNodeDetails(prev => {
      const next = {
        ...prev,
        [selectedNode]: {
          ...prev[selectedNode],
          image: imageData,
        },
      };

      // Overwrite the CURRENT snapshot using the SAME updated details
      if (
        networkRef?.current &&
        Array.isArray(timelineEntries) &&
        typeof selectedSnapshotIndex === "number" &&
        timelineEntries[selectedSnapshotIndex]
      ) {
        setTimelineEntries(prevTE => {
          const copy = [...prevTE];
          const fresh = createSnapshot(
            networkRef,
            { edges: networkRef.current.body.data.edges.get() },
            next // ← pass the updated map
          );
          copy[selectedSnapshotIndex] = { ...copy[selectedSnapshotIndex], snapshot: fresh };
          return copy;
        });
      }

      return next;
    });

    setGraphData(prev => {
      const updatedNodes = prev.nodes.map(node =>
        node.id === selectedNode ? { ...node, shape: "circularImage", image: imageData } : node
      );
      return { ...prev, nodes: updatedNodes };
    });
  };

  reader.readAsDataURL(file);
}

export function addValueToArrayField({ nodeId, fieldId, value, setNodeDetails }) {
  const v = (value ?? '').trim();
  if (!v) return;
  setNodeDetails(prev => {
    const current = prev[nodeId]?.[fieldId] || [];
    if (current.includes(v)) return prev;
    return {
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [fieldId]: [...current, v]
      }
    };
  });
}

// Remove a value from an array-typed node field.
export function removeValueFromArrayField({ nodeId, fieldId, value, setNodeDetails }) {
  setNodeDetails(prev => {
    const current = prev[nodeId]?.[fieldId] || [];
    return {
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [fieldId]: current.filter(x => x !== value)
      }
    };
  });
}

// --- Suggestions ---

// For dynamic-multiselect: suggest from field.options (minus already-selected), filtered.
export function getSuggestions(field, selectedValues = [], filterText = '') {
  const f = (filterText || '').toLowerCase();
  const selected = new Set(selectedValues);
  return (field.options || [])
    .filter(opt => opt.toLowerCase().includes(f) && !selected.has(opt));
}

// --- Keyboard helper ---

// On Enter in a dynamic input, add the value and fire optional afterAdd callback.
export function handleEnterAddToArrayField(e, { nodeId, fieldId, setNodeDetails, afterAdd }) {
  if (e.key !== 'Enter') return;

  e.preventDefault();
  const raw = e.currentTarget.value;
  const val = (raw ?? '').trim();
  if (!val) return;

  addValueToArrayField({ nodeId, fieldId, value: val, setNodeDetails });
  if (typeof afterAdd === 'function') afterAdd(val);
  e.currentTarget.value = '';
}

// Persist a value into projectSettings.nodeFields[*].options (idempotent)
export function promoteOptionToProjectSettings(setProjectSettings, fieldId, value) {
  const v = (value ?? '').trim();
  if (!v) return;

  setProjectSettings(prev => {
    if (!prev?.nodeFields) return prev;
    const nodeFields = prev.nodeFields.map(f => {
      if (f.id !== fieldId) return f;
      const opts = Array.isArray(f.options) ? f.options : [];
      if (opts.includes(v)) return f;
      const next = Array.from(new Set([...opts, v])).sort((a, b) => a.localeCompare(b));
      return { ...f, options: next };
    });
    return { ...prev, nodeFields };
  });
}

export function pruneDeletedNodeTypes(deletedTypes, replacementType, setNodeDetails, nodeDetails, networkRef) {
  if (!Array.isArray(deletedTypes) || deletedTypes.length === 0) return;
  const deleted = new Set(deletedTypes);
  const fallback = replacementType || "Default";

  // Update nodeDetails
  setNodeDetails(prev => {
    if (!prev) return prev;
    let changed = false;
    const next = { ...prev };
    for (const [nodeId, details] of Object.entries(prev)) {
      const t = details?.type;
      if (t && deleted.has(t)) {
        next[nodeId] = { ...details, type: fallback };
        changed = true;
      }
    }
    return changed ? next : prev;
  });

  // Mirror change onto vis nodes (for future shape logic)
  try {
    const net = networkRef.current;
    if (net?.body?.data?.nodes) {
      const updates = [];
      for (const [nodeId, details] of Object.entries(nodeDetails)) {
        const t = details?.type;
        if (t && deleted.has(t)) {
          updates.push({ id: nodeId, type: fallback });
        }
      }
      if (updates.length) net.body.data.nodes.update(updates);
    }
  } catch { /* no-op */ }
}

// Remove deleted multiselect options from every node for a specific field
export function pruneDeletedOptionsFromNodes(fieldId, deletedValues, setNodeDetails) {
  if (!Array.isArray(deletedValues) || deletedValues.length === 0) return;
  const deleted = new Set(deletedValues);
  setNodeDetails(prev => {
    if (!prev) return prev;
    let changed = false;
    const next = { ...prev };
    for (const [nodeId, details] of Object.entries(prev)) {
      const arr = details?.[fieldId];
      if (!Array.isArray(arr) || arr.length === 0) continue;
      const keep = arr.filter(v => !deleted.has(v));
      if (keep.length !== arr.length) {
        next[nodeId] = { ...details, [fieldId]: keep };
        changed = true;
      }
    }
    return changed ? next : prev;
  });
}