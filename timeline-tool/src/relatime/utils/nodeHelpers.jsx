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

export function handleImageUpload(nodesRef, nodeId, file, setNodeDetails, setGraphData) {
  if (!file || !(file instanceof Blob)) {
    console.error("Invalid file passed to handleImageUpload:", file);
    return;
  }

  const reader = new FileReader();
  reader.onloadend = () => {
    const image = reader.result;

    setNodeDetails((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        image,
      },
    }));

    setGraphData((prev) => ({
      nodes: prev.nodes.map((n) =>
        n.id === nodeId ? { ...n, shape: 'circularImage', image } : n
      ),
      edges: prev.edges,
    }));

    if (nodesRef?.current) {
      nodesRef.current.update({
        id: nodeId,
        shape: 'circularImage',
        image,
      });
    }
  };

  reader.readAsDataURL(file);
}

export function handleRoleKeyDown(
  e,
  field,
  availableSetter,
  nodeDetails,
  selectedNode,
  setNodeDetails,
  handleNodeFieldChange,
  availableRoles,
  setRoleDropdownFilter,
  setShowDropdown,
  roleInputRef,
) {
  if (e.key === 'Enter' && e.target.value.trim()) {
    const newValue = e.target.value.trim();
    const updated = [...new Set([...(nodeDetails[selectedNode]?.[field] || []), newValue])];

    handleNodeFieldChange(selectedNode, field, updated, setNodeDetails);

    if (!availableRoles.includes(newValue)) {
      const updatedRoles = [...availableRoles, newValue].sort((a, b) => a.localeCompare(b));
      availableSetter(updatedRoles);
    }

    setRoleDropdownFilter('');
    setShowDropdown(prev => ({ ...prev, roles: false }));
    if (roleInputRef.current) roleInputRef.current.blur();


    e.target.value = '';
    e.preventDefault();
  }
}


export function handleRemoveValue(
  field,
  value,
  available,
  availableSetter,
  nodeDetails,
  selectedNode,
  setNodeDetails
) {
  const current = nodeDetails[selectedNode]?.[field] || [];
  const updated = current.filter(item => item !== value);
  const updatedNodeDetails = {
    ...nodeDetails,
    [selectedNode]: {
      ...nodeDetails[selectedNode],
      [field]: updated
    }
  };

  setNodeDetails(updatedNodeDetails);

  if (field === 'roles') {
    const stillUsed = Object.values(updatedNodeDetails).some(details =>
      (details.roles || []).includes(value)
    );
    if (!stillUsed) {
      availableSetter(prev => prev.filter(item => item !== value));
    }
  }
}

export function addSuggestion({
  field,
  value,
  available,
  setter,
  nodeDetails,
  selectedNode,
  setNodeDetails,
  handleNodeFieldChange,
  setDropdownFilter,
  setRoleDropdownFilter,
  setShowDropdown,
  secondaryInputRef,
  roleInputRef,
}) {
  if (!value.trim()) return;

  const current = nodeDetails[selectedNode]?.[field] || [];
  if (current.includes(value)) return;

  handleNodeFieldChange(selectedNode, field, [...current, value], setNodeDetails);

  if (!available.includes(value)) {
    const updated = [...available, value];
    if (field === 'roles') {
      updated.sort((a, b) => a.localeCompare(b));
    }
    setter(updated);
  }

  if (field === "secondarySeries") {
    setDropdownFilter("");
    setShowDropdown((prev) => ({ ...prev, secondarySeries: false }));
    if (secondaryInputRef.current) secondaryInputRef.current.value = "";
  }

  if (field === "roles") {
    setRoleDropdownFilter("");
    setShowDropdown((prev) => ({ ...prev, roles: false }));
    if (roleInputRef.current) roleInputRef.current.value = "";
  }
}