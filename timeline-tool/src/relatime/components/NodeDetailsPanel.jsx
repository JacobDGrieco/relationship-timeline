import { useState, useRef } from 'react';
import { useProject } from '../context/ProjectContext.jsx';
import {
    handleImageUpload,
    handleNodeFieldChange,
    addValueToArrayField,
    removeValueFromArrayField,
    getStaticSuggestions,
    getDynamicSuggestions,
    handleEnterAddToArrayField,
} from "../utils/nodeHelpers";

export default function NodeDetailsPanel({
    setGraphData,
    selectedNode,
    nodeDetails,
    setNodeDetails,
    networkRef,
    nodesRef,
    setIsDetailsVisible,
    setJustClosedRecently,
    isDetailsVisible
}) {
    const { projectSettings } = useProject();
    const [isEditingName, setIsEditingName] = useState(false);
    const [showDropdown, setShowDropdown] = useState({});
    const [filterByField, setFilterByField] = useState({});
    const inputRefs = useRef({});

    const data = nodeDetails[selectedNode] || {};
    if (!selectedNode) return null;

    const ensureRef = (fieldId) => {
        if (!inputRefs.current[fieldId]) {
            inputRefs.current[fieldId] = { current: null };
        }
        return (el) => { inputRefs.current[fieldId].current = el; };
    };

    const setFieldFilter = (fieldId, value) =>
        setFilterByField(prev => ({ ...prev, [fieldId]: value }));

    const openDropdown = (fieldId) =>
        setShowDropdown(prev => ({ ...prev, [fieldId]: true }));

    const closeDropdownSoon = (fieldId) =>
        setTimeout(() => setShowDropdown(prev => ({ ...prev, [fieldId]: false })), 150);

    
    return (
        <div className={`slide-pane ${isDetailsVisible ? 'visible' : 'hidden'}`}>
            <button
                className="close-details-button"
                onClick={() => {
                    setIsDetailsVisible(false);
                    setTimeout(() => setJustClosedRecently(false), 300);
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
            </div>
            <>
                {projectSettings?.nodeFields?.length > 0 && (
                    <div className="node-detail-fields">
                        {projectSettings.nodeFields.map((field, idx) => {
                            const fieldValue = data[field.id] || '';

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
                                case 'image-upload':
                                    return (
                                        <div className="details-row" key={field.id}>
                                            <label className="details-label">{field.label}</label>
                                            <div className="details-input">
                                                <label className="file-upload-label">
                                                    Upload Image
                                                    <input
                                                        type="file"
                                                        className="file-upload-input"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageUpload(
                                                            nodesRef,
                                                            selectedNode,
                                                            e.target.files[0],
                                                            setNodeDetails,
                                                            setGraphData
                                                        )}
                                                    />
                                                </label>
                                                {fieldValue && <div className="file-name">Image uploaded</div>}
                                            </div>
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
                                    const suggestions = getStaticSuggestions(field, selected, filterByField[field.id] || '');

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
                                                    onFocus={() => openDropdown(field.id)}
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
                                    const suggestions = getDynamicSuggestions(field, nodeDetails, selected, filterByField[field.id] || '');

                                    return (
                                        <div className="details-row" key={field.id}>
                                            <label className="details-label">{field.label}</label>
                                            <div className="details-input relative">
                                                <input
                                                    ref={ensureRef(field.id)}
                                                    type="text"
                                                    placeholder="Type and press Enter"
                                                    onKeyDown={(e) => handleEnterAddToArrayField(e, { nodeId: selectedNode, fieldId: field.id, setNodeDetails })}
                                                    onChange={(e) => { setFieldFilter(field.id, e.target.value); openDropdown(field.id); }}
                                                    onFocus={() => openDropdown(field.id)}
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
                                default:
                                    return null;
                            }
                        })}
                    </div>
                )}
            </>
        </div>
    )
}