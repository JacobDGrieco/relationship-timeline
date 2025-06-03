import { useState, useRef } from 'react';
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
    isDetailsVisible,
    SERIES_OPTIONS,
    STATUS_OPTIONS,
    availableRoles,
    setAvailableRoles,
    availableSecondarySeries,
    setAvailableSecondarySeries
}) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [showDropdown, setShowDropdown] = useState({ roles: false, secondarySeries: false });
    const [dropdownFilter, setDropdownFilter] = useState('');
    const [roleDropdownFilter, setRoleDropdownFilter] = useState('');
    const roleInputRef = useRef(null);
    const secondaryInputRef = useRef(null);

    const filteredRoles = availableRoles.filter(role =>
        role.toLowerCase().includes(roleDropdownFilter.toLowerCase())
    );
    const filteredSecondarySeries = availableSecondarySeries.filter(series =>
        series.toLowerCase().includes(dropdownFilter.toLowerCase())
    );

    const data = nodeDetails[selectedNode] || {};
    const currentRoles = nodeDetails[selectedNode]?.roles || [];
    const currentSecondaries = nodeDetails[selectedNode]?.secondarySeries || [];

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

            {/* Image Upload */}
            <div className="details-row">
                <label className="details-label">Image</label>
                <div className="details-input">
                    <label className="file-upload-label">
                        Upload Image
                        <input type="file" className="file-upload-input" accept="image/*" onChange={(e) => handleImageUpload(
                            nodesRef,
                            selectedNode,
                            e.target.files[0],
                            setNodeDetails,
                            setGraphData
                        )} />
                    </label>
                    {data.image && <div className="file-name">Image uploaded</div>}
                </div>
            </div>

            {/* Primary Series */}
            <div className="details-row">
                <label className="details-label">Primary Series</label>
                <select
                    className="details-input"
                    value={data.primarySeries || ''}
                    onChange={(e) => handleNodeFieldChange(selectedNode, 'primarySeries', e.target.value, setNodeDetails)}
                >
                    {SERIES_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>

            {/* Secondary Series */}
            <div className="details-row">
                <label className="details-label">Secondary Series</label>
                <div className="details-input relative">
                    <input
                        ref={secondaryInputRef}
                        type="text"
                        placeholder="Select a Series"
                        onChange={(e) => {
                            setDropdownFilter(e.target.value);
                            setShowDropdown(prev => ({ ...prev, secondarySeries: true }));
                        }}
                        onFocus={() => setShowDropdown(prev => ({ ...prev, secondarySeries: true }))}
                        onBlur={() => setTimeout(() => setShowDropdown(prev => ({ ...prev, secondarySeries: false })), 150)}
                        className="w-full border rounded p-1"
                    />
                    {showDropdown.secondarySeries && filteredSecondarySeries.length > 0 && (
                        <div className="dropdown-list">
                            {filteredSecondarySeries.map((option) => (
                                <div
                                    key={option}
                                    className="dropdown-item"
                                    onMouseDown={() => addSuggestion({
                                        field: "secondarySeries",
                                        value: option,
                                        available: availableSecondarySeries,
                                        setter: setAvailableSecondarySeries,
                                        nodeDetails,
                                        selectedNode,
                                        setNodeDetails,
                                        handleNodeFieldChange,
                                        setDropdownFilter,
                                        setRoleDropdownFilter,
                                        setShowDropdown,
                                        secondaryInputRef,
                                        roleInputRef,
                                    })}
                                >
                                    {option}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="tag-container">
                        {currentSecondaries.map((val) => (
                            <span className="tag cursor-pointer" key={val} onClick={() =>
                                handleRemoveValue(
                                    'secondarySeries',
                                    val,
                                    availableSecondarySeries,
                                    setAvailableSecondarySeries,
                                    nodeDetails,
                                    selectedNode,
                                    setNodeDetails
                                )
                            }
                            >{val}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status */}
            <div className="details-row">
                <label className="details-label">Status</label>
                <select
                    className="details-input"
                    value={data.status || 'Alive'}
                    onChange={(e) => handleNodeFieldChange(selectedNode, 'status', e.target.value, setNodeDetails)}
                >
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>

            {/* Current Role(s) */}
            <div className="details-row">
                <label className="details-label">Current Role(s)</label>
                <div className="details-input relative">
                    <input
                        ref={roleInputRef}
                        type="text"
                        placeholder="Type and press Enter"
                        onKeyDown={(e) =>
                            handleRoleKeyDown(
                                e,
                                'roles',
                                setAvailableRoles,
                                nodeDetails,
                                selectedNode,
                                setNodeDetails,
                                handleNodeFieldChange,
                                availableRoles,
                                setRoleDropdownFilter,
                                setShowDropdown,
                                roleInputRef,
                            )
                        }
                        onChange={(e) => {
                            setRoleDropdownFilter(e.target.value);
                            setShowDropdown(prev => ({ ...prev, roles: true }));
                        }}
                        onFocus={() => setShowDropdown(prev => ({ ...prev, roles: true }))}
                        onBlur={() => setTimeout(() => setShowDropdown(prev => ({ ...prev, roles: false })), 150)}
                        className="w-full border rounded p-1"
                    />
                    {showDropdown.roles && filteredRoles.length > 0 && (
                        <div className="dropdown-list">
                            {filteredRoles.map((option) => (
                                <div
                                    className="dropdown-item"
                                    key={option}
                                    onMouseEnter={(e) => {
                                        const wrapper = e.currentTarget;
                                        const span = wrapper.querySelector("span");
                                        wrapper.classList.add("hover-scroll");

                                        const overflowAmount = span.scrollWidth - wrapper.clientWidth;
                                        if (overflowAmount > 0) {
                                            span.style.transform = `translateX(-${overflowAmount}px)`;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        const wrapper = e.currentTarget;
                                        const span = wrapper.querySelector("span");
                                        span.style.transform = "translateX(0px)";
                                        wrapper.classList.remove("hover-scroll");
                                    }}
                                >
                                    <span>{option}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="tag-container">
                        {currentRoles.map((val) => (
                            <span className="tag cursor-pointer" key={val} onClick={() =>
                                handleRemoveValue(
                                    'roles',
                                    val,
                                    availableRoles,
                                    setAvailableRoles,
                                    nodeDetails,
                                    selectedNode,
                                    setNodeDetails
                                )
                            }>{val}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    )
}