import { useState, useRef } from 'react';
import { useProject } from '../context/ProjectContext.jsx';
import { handleRoleKeyDown, handleImageUpload, handleNodeFieldChange, handleRemoveValue, addSuggestion } from "../utils/nodeHelpers";

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

    const data = nodeDetails[selectedNode] || {};
    if (!selectedNode) return null;

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
                                case 'static-multiselect':
                                    return (
                                        <div className="details-row" key={field.id}>
                                            <label className="details-label">{field.label}</label>
                                            <div className="details-input relative">
                                                <input
                                                    ref={secondaryInputRef}
                                                    type="text"
                                                    placeholder={`Select a ${field.label}`}
                                                    onChange={(e) => {
                                                        setDropdownFilter(e.target.value);
                                                        setShowDropdown(prev => ({ ...prev, [field.id]: true }));
                                                    }}
                                                    onFocus={() => setShowDropdown(prev => ({ ...prev, [field.id]: true }))}
                                                    onBlur={() => setTimeout(() => setShowDropdown(prev => ({ ...prev, [field.id]: false })), 150)}
                                                    className="w-full border rounded p-1"
                                                />
                                                {showDropdown[field.id] && filteredSecondarySeries.length > 0 && (
                                                    <div className="dropdown-list">
                                                        {filteredSecondarySeries.map((option) => (
                                                            <div
                                                                key={option}
                                                                className="dropdown-item"
                                                                onMouseDown={() => addSuggestion({
                                                                    field: field.id,
                                                                    value: option,
                                                                    available: availableSecondarySeries,
                                                                    setter: () => { },
                                                                    nodeDetails,
                                                                    selectedNode,
                                                                    setNodeDetails,
                                                                    handleNodeFieldChange,
                                                                    setDropdownFilter,
                                                                    secondaryInputRef,
                                                                    roleInputRef,
                                                                })}
                                                            >{option}</div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="tag-container">
                                                    {(fieldValue || []).map((val) => (
                                                        <span
                                                            className="tag cursor-pointer"
                                                            key={val}
                                                            onClick={() => handleRemoveValue(
                                                                field.id,
                                                                val,
                                                                availableSecondarySeries,
                                                                () => { },
                                                                nodeDetails,
                                                                selectedNode,
                                                                setNodeDetails
                                                            )}
                                                        >{val}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                case 'dynamic-multiselect':
                                    return (
                                        <div className="details-row" key={field.id}>
                                            <label className="details-label">{field.label}</label>
                                            <div className="details-input relative">
                                                <input
                                                    ref={roleInputRef}
                                                    type="text"
                                                    placeholder={`Type and press Enter`}
                                                    onKeyDown={(e) => handleRoleKeyDown(
                                                        e,
                                                        field.id,
                                                        () => { },
                                                        nodeDetails,
                                                        selectedNode,
                                                        setNodeDetails,
                                                        handleNodeFieldChange,
                                                        [],
                                                        setRoleDropdownFilter,
                                                        setShowDropdown,
                                                        roleInputRef,
                                                    )}
                                                    onChange={(e) => {
                                                        setRoleDropdownFilter(e.target.value);
                                                        setShowDropdown(prev => ({ ...prev, [field.id]: true }));
                                                    }}
                                                    onFocus={() => setShowDropdown(prev => ({ ...prev, [field.id]: true }))}
                                                    onBlur={() => setTimeout(() => setShowDropdown(prev => ({ ...prev, [field.id]: false })), 150)}
                                                    className="w-full border rounded p-1"
                                                />
                                                {showDropdown[field.id] && filteredRoles.length > 0 && (
                                                    <div className="dropdown-list">
                                                        {filteredRoles.map((option) => (
                                                            <div className="dropdown-item" key={option}><span>{option}</span></div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="tag-container">
                                                    {(fieldValue || []).map((val) => (
                                                        <span
                                                            className="tag cursor-pointer"
                                                            key={val}
                                                            onClick={() => handleRemoveValue(
                                                                field.id,
                                                                val,
                                                                [],
                                                                () => { },
                                                                nodeDetails,
                                                                selectedNode,
                                                                setNodeDetails
                                                            )}
                                                        >{val}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
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