import { generateUniqueID } from "./graphHelpers";
import { handleUpdateSnapshots } from "./timelineHelpers";

export function handleAddPerson({
  personName,
  nodesRef,
  setGraphData,
  setNodeDetails,
  setPersonName,
  setConnectionLabel,
  setConnectionDirection,
  setApplyMode,
  setShowAddPerson,
  timelineEntries,
  setTimelineEntries,
  applyMode,
  selectedSnapshotIndex,
  partialStartIndex,
  partialEndIndex,
  networkRef,
  nodeDetails,
  projectSettings
}) {
  const id = generateUniqueID();
  const label = personName || `Node ${id}`;

  const newNode = { id, label };
  nodesRef.current.add(newNode);

  setGraphData(prev => ({
    nodes: [...prev.nodes, newNode],
    edges: [...prev.edges]
  }));

  const baseDetails = {
    name: personName
  };

  if (projectSettings?.length) {
    for (const field of projectSettings) {
      if (!(field?.id in baseDetails)) {
        switch (field.type) {
          case 'description':
          case 'dropdown':
            baseDetails[field.id] = '';
            break;
          case 'static-multiselect':
          case 'dynamic-multiselect':
            baseDetails[field.id] = [];
            break;
          case 'image-upload':
            baseDetails[field.id] = null;
            break;
          default:
            baseDetails[field.id] = '';
        }
      }
    }
  }

  setNodeDetails(prev => ({
    ...prev,
    [id]: baseDetails,
  }));

  handleUpdateSnapshots(newNode, 'node', {
    applyMode,
    selectedSnapshotIndex,
    partialStartIndex,
    partialEndIndex,
    timelineEntries,
    setTimelineEntries,
    networkRef,
    nodeDetails
  });

  setPersonName('');
  setConnectionLabel('');
  setConnectionDirection('normal');
  setApplyMode('none');
  setShowAddPerson(false);
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
  nodesRef,
  selectedNode,
  file,
  setNodeDetails,
  setGraphData
) {
  if (!file || !selectedNode) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const imageData = e.target.result;

    setNodeDetails(prev => ({
      ...prev,
      [selectedNode]: {
        ...prev[selectedNode],
        image: imageData,
      }
    }));

    // Update the graphData to reflect the image change
    setGraphData(prev => {
      const updatedNodes = prev.nodes.map(node => {
        if (node.id === selectedNode) {
          return { ...node, shape: "circularImage", image: imageData };
        }
        return node;
      });
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

// For static-multiselect: suggest from field.options (minus already-selected), filtered.
export function getStaticSuggestions(field, selectedValues = [], filterText = '') {
  const f = (filterText || '').toLowerCase();
  const selected = new Set(selectedValues);
  return (field.options || [])
    .filter(opt => opt.toLowerCase().includes(f) && !selected.has(opt));
}

// For dynamic-multiselect: union of field.options + values seen across all nodes for this field.
export function getDynamicSuggestions(field, nodeDetails, selectedValues = [], filterText = '') {
  const f = (filterText || '').toLowerCase();
  const selected = new Set(selectedValues);
  const fromOptions = field.options || [];
  const fromNodes = Array.from(
    new Set(Object.values(nodeDetails).flatMap(nd => (nd?.[field.id] || [])))
  );
  return Array.from(new Set([...fromOptions, ...fromNodes]))
    .filter(opt => opt.toLowerCase().includes(f) && !selected.has(opt));
}

// --- Keyboard helper ---

// On Enter in a dynamic input, add the input's value to the array field.
export function handleEnterAddToArrayField(e, { nodeId, fieldId, setNodeDetails }) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const val = e.currentTarget.value;
  addValueToArrayField({ nodeId, fieldId, value: val, setNodeDetails });
  e.currentTarget.value = '';
}