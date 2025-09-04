import { useState, useRef } from 'react';
import { useProject } from '../context/ProjectContext.jsx';
import {
    handleDeleteNode,
    handleImageUpload,
    handleNodeFieldChange,
    addValueToArrayField,
    removeValueFromArrayField,
    getSuggestions,
    handleEnterAddToArrayField,
    promoteOptionToProjectSettings
} from "../utils/nodeHelpers";

export default function NodeDetailsPanel({
    setGraphData,
    selectedNode,
    nodeDetails,
    setNodeDetails,
    networkRef,
    nodesRef,
    isDetailsVisible,
    setIsDetailsVisible,
    setJustClosedRecently,
    setSelectedNode
}) {
    const { projectSettings, setProjectSettings } = useProject();
    const [isClosing, setIsClosing] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingType, setIsEditingType] = useState(false);
    const [showDropdown, setShowDropdown] = useState({});
    const [filterByField, setFilterByField] = useState({});
    const inputRefs = useRef({});
    const closeTimers = useRef({});

    const data = nodeDetails[selectedNode] || {};
    if (!selectedNode) return null;

    const typeOptions = Array.isArray(projectSettings?.nodeTypes) && projectSettings.nodeTypes.length > 0
        ? projectSettings.nodeTypes
        : ["Default"];
    const currentType = data?.type || typeOptions[0];

    const ensureRef = (fieldId) => {
        if (!inputRefs.current[fieldId]) {
            inputRefs.current[fieldId] = { current: null };
        }
        return (el) => { inputRefs.current[fieldId].current = el; };
    };

    const setFieldFilter = (fieldId, value) =>
        setFilterByField(prev => ({ ...prev, [fieldId]: value }));

    const openDropdown = (fieldId) => {
        // cancel a pending close for this field
        if (closeTimers.current[fieldId]) {
            clearTimeout(closeTimers.current[fieldId]);
            closeTimers.current[fieldId] = null;
        }
        setShowDropdown(prev => ({ ...prev, [fieldId]: true }));
    };

    const closeDropdownSoon = (fieldId) => {
        // replace any existing timer
        if (closeTimers.current[fieldId]) clearTimeout(closeTimers.current[fieldId]);
        closeTimers.current[fieldId] = setTimeout(() => {
            setShowDropdown(prev => ({ ...prev, [fieldId]: false }));
            closeTimers.current[fieldId] = null;
        }, 120);
    };


    return (
        <div className={['slide-pane', isDetailsVisible && !isClosing ? 'slide-in' : '', isClosing ? 'slide-out' : ''].join(' ').trim()}>
            <button
                className="close-details-button"
                onClick={() => {
                    if (isClosing) return;
                    setIsClosing(true);
                    setTimeout(() => {
                        setIsClosing(false);
                        setIsDetailsVisible(false);
                        setJustClosedRecently(false);
                    }, 300);
                }}
            >×</button>
            <div className="details-header">
                {isEditingName ? (
                    <input
                        type="text"
                        autoFocus
                        defaultValue={nodeDetails[selectedNode]?.name || `Node ${selectedNode}`}
                        onBlur={() => setIsEditingName(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const newName = e.target.value.trim();
                                if (newName) {
                                    setNodeDetails(prev => ({
                                        ...prev,
                                        [selectedNode]: {
                                            ...prev[selectedNode],
                                            name: newName,
                                        },
                                    }));

                                    networkRef.current.body.data.nodes.update({
                                        id: selectedNode,
                                        label: newName,
                                    });

                                    setIsEditingName(false);
                                }
                            }
                        }}
                        className="editable-node-name"
                    />
                ) : (
                    <h3
                        className="text-lg font-bold mb-2 editable-node-name"
                        onClick={() => setIsEditingName(true)}
                    >
                        {nodeDetails[selectedNode]?.name || `Node ${selectedNode}`}
                    </h3>
                )}
                {/* Node Type: click-to-edit just like name */}
                {isEditingType ? (
                    <select
                        autoFocus
                        value={currentType}
                        onChange={(e) => {
                            const nextType = e.target.value;
                            // Persist to details
                            setNodeDetails(prev => ({
                                ...prev,
                                [selectedNode]: {
                                    ...prev[selectedNode],
                                    type: nextType
                                }
                            }));
                            // Also mirror on vis node for future shape logic
                            try {
                                networkRef.current?.body?.data?.nodes?.update?.({ id: selectedNode, type: nextType });
                            } catch { }
                            setIsEditingType(false);
                        }}
                        onBlur={() => setIsEditingType(false)}
                        className="details-input"
                        style={{ marginTop: '4px', maxWidth: 240 }}
                    >
                        {typeOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                ) : (
                    <div
                        className="node-type-display"
                        onClick={() => setIsEditingType(true)}
                        title="Click to edit type"
                    >
                        <span className="node-type-label"></span> {currentType}
                    </div>
                )}
            </div>
            <>
                <div className="node-detail-fields">
                    <div className="details-row">
                        <label className="details-label">Image</label>
                        <div className="details-input">
                            <label className="file-upload-label">
                                Upload Image
                                <input
                                    type="file"
                                    className="file-upload-input"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        handleImageUpload(nodesRef, selectedNode, file, setNodeDetails, setGraphData);
                                    }}
                                />
                            </label>
                            {data?.image && <div className="file-name">Image uploaded</div>}
                        </div>
                    </div>
                </div>

                {projectSettings?.nodeFields?.length > 0 && (
                    <div className="node-detail-fields">
                        {projectSettings.nodeFields.map((field, idx) => {
                            const fieldValue = data[field.id] ?? (field.type.includes('multiselect') ? [] : '');

                            switch (field.type) {
                                case 'description':
                                    return (
                                        <div className="details-row" key={field.id}>
                                            <label className="details-label">{field.label}</label>
                                            <textarea
                                                className="details-input"
                                                value={fieldValue}
                                                onChange={(e) => handleNodeFieldChange(selectedNode, field.id, e.target.value, setNodeDetails)}
                                            />
                                        </div>
                                    );
                                case 'dropdown':
                                    return (
                                        <div className="details-row" key={field.id}>
                                            <label className="details-label">{field.label}</label>
                                            <select
                                                className="details-input"
                                                value={fieldValue || ''}
                                                onChange={(e) => handleNodeFieldChange(selectedNode, field.id, e.target.value, setNodeDetails)}
                                            >
                                                <option key="" value=""></option>
                                                {field.options.map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                    );
                                case 'static-multiselect': {
                                    const selected = data[field.id] || [];
                                    const suggestions = getSuggestions(field, selected, filterByField[field.id] || '');

                                    return (
                                        <div className="details-row" key={field.id}>
                                            <label className="details-label">{field.label}</label>
                                            <div className="details-input relative">
                                                <input
                                                    ref={ensureRef(field.id)}
                                                    type="text"
                                                    placeholder={`Select ${field.label}`}
                                                    onChange={(e) => {
                                                        setFieldFilter(field.id, e.target.value);
                                                        openDropdown(field.id);
                                                    }}
                                                    onFocus={() => { setFieldFilter(field.id, ''); openDropdown(field.id); }}
                                                    onBlur={() => closeDropdownSoon(field.id)}
                                                    className="w-full border rounded p-1"
                                                />
                                                {showDropdown[field.id] && suggestions.length > 0 && (
                                                    <div className="dropdown-list">
                                                        {suggestions.map(opt => (
                                                            <div
                                                                key={opt}
                                                                className="dropdown-item"
                                                                onMouseDown={() => {
                                                                    addValueToArrayField({ nodeId: selectedNode, fieldId: field.id, value: opt, setNodeDetails });
                                                                    setFieldFilter(field.id, '');
                                                                    inputRefs.current[field.id]?.current && (inputRefs.current[field.id].current.value = '');
                                                                    setShowDropdown(prev => ({ ...prev, [field.id]: false }));
                                                                }}
                                                            >
                                                                {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="tag-container">
                                                    {selected.map(val => (
                                                        <span
                                                            key={val}
                                                            className="tag cursor-pointer"
                                                            onClick={() => removeValueFromArrayField({ nodeId: selectedNode, fieldId: field.id, value: val, setNodeDetails })}
                                                        >
                                                            {val}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                case 'dynamic-multiselect': {
                                    const selected = data[field.id] || [];

                                    const filter = (filterByField[field.id] || '').toLowerCase();
                                    const fromOptions = Array.isArray(field.options) ? field.options : [];
                                    const fromNodes = Array.from(new Set(
                                        Object.values(nodeDetails).flatMap(nd => nd?.[field.id] || [])
                                    ));
                                    const suggestions = Array.from(new Set([...fromOptions, ...fromNodes]))
                                        .filter(opt => opt.toLowerCase().includes(filter) && !selected.includes(opt));

                                    return (
                                        <div className="details-row" key={field.id}>
                                            <label className="details-label">{field.label}</label>
                                            <div className="details-input relative">
                                                <input
                                                    key={field.id}
                                                    ref={ensureRef(field.id)}
                                                    type="text"
                                                    placeholder="Type and press Enter"
                                                    onKeyDown={(e) =>
                                                        handleEnterAddToArrayField(e, {
                                                            nodeId: selectedNode,
                                                            fieldId: field.id,
                                                            setNodeDetails,
                                                            afterAdd: (v) => promoteOptionToProjectSettings(setProjectSettings, field.id, v),
                                                        })
                                                    }
                                                    onChange={(e) => { setFieldFilter(field.id, e.target.value); openDropdown(field.id); }}
                                                    onFocus={() => { setFieldFilter(field.id, ''); openDropdown(field.id); }}
                                                    onBlur={() => closeDropdownSoon(field.id)}
                                                    className="w-full border rounded p-1"
                                                />
                                                {showDropdown[field.id] && suggestions.length > 0 && (
                                                    <div className="dropdown-list">
                                                        {suggestions.map(opt => (
                                                            <div
                                                                key={opt}
                                                                className="dropdown-item"
                                                                onMouseDown={() => {
                                                                    addValueToArrayField({ nodeId: selectedNode, fieldId: field.id, value: opt, setNodeDetails });
                                                                    promoteOptionToProjectSettings(setProjectSettings, field.id, opt);
                                                                    setFieldFilter(field.id, '');
                                                                    inputRefs.current[field.id]?.current && (inputRefs.current[field.id].current.value = '');
                                                                    setShowDropdown(prev => ({ ...prev, [field.id]: false }));
                                                                }}
                                                            >
                                                                {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="tag-container">
                                                    {selected.map(val => (
                                                        <span
                                                            key={val}
                                                            className="tag cursor-pointer"
                                                            onClick={() => removeValueFromArrayField({ nodeId: selectedNode, fieldId: field.id, value: val, setNodeDetails })}
                                                        >
                                                            {val}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                default:
                                    return null;
                            }
                        })}
                    </div>
                )}
            </>
            <button
                style={{
                    position: 'absolute',
                    right: '12px',
                    bottom: '12px',
                    backgroundColor: 'rgb(200, 50, 50)'
                }}
                onClick={() => {
                    handleDeleteNode(networkRef, selectedNode, setGraphData);
                    setIsDetailsVisible(false);
                    setJustClosedRecently(false);
                    setSelectedNode(null);
                }}
            >
                Delete
            </button>
        </div >
    )
}