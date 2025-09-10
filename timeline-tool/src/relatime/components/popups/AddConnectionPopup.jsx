import { useMemo, useState, useRef, useEffect } from "react";
import { handleAddConnection } from "../../utils/graphHelpers"

export default function AddConnectionPopup({
    nodeDetails,
    connectionSource,
    setConnectionSource,
    connectionTarget,
    setConnectionTarget,
    connectionLabel,
    setConnectionLabel,
    connectionDirection,
    setConnectionDirection,
    connectionLevel,
    setConnectionLevel,
    editingEdgeId,
    setEditingEdgeId,
    setShowAddConnection,
    setGraphData,
    networkRef,
    timelineEntries,
    selectedSnapshotIndex,
    setTimelineEntries,
    applyMode,
    setApplyMode,
    partialStartIndex,
    setPartialStartIndex,
    partialEndIndex,
    setPartialEndIndex
}) {
    const [showDropdown, setShowDropdown] = useState({ source: false, target: false });
    const [sourceFilter, setSourceFilter] = useState(connectionSource || "");
    const [targetFilter, setTargetFilter] = useState(connectionTarget || "");
    const srcRef = useRef(null);
    const tgtRef = useRef(null);
    const closeTimers = useRef({}); // avoid closing before click lands

    useEffect(() => setSourceFilter(connectionSource || ""), [connectionSource]);
    useEffect(() => setTargetFilter(connectionTarget || ""), [connectionTarget]);

    const openDropdown = (key) => {
        if (closeTimers.current[key]) { clearTimeout(closeTimers.current[key]); closeTimers.current[key] = null; }
        setShowDropdown((p) => ({ ...p, [key]: true }));
    };
    const closeDropdownSoon = (key) => {
        if (closeTimers.current[key]) clearTimeout(closeTimers.current[key]);
        closeTimers.current[key] = setTimeout(() => {
            setShowDropdown((p) => ({ ...p, [key]: false }));
            closeTimers.current[key] = null;
        }, 120);
    };

    const nodeNameOptions = useMemo(() => {
        const names = Object.values(nodeDetails || {})
            .map(nd => (nd?.name || "").trim())
            .filter(Boolean);
        return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    }, [nodeDetails]);

    const sourceSuggestions = useMemo(
        () => nodeNameOptions.filter(n => n.toLowerCase().includes((sourceFilter || "").toLowerCase())),
        [nodeNameOptions, sourceFilter]
    );
    const targetSuggestions = useMemo(
        () => nodeNameOptions.filter(n => n.toLowerCase().includes((targetFilter || "").toLowerCase())),
        [nodeNameOptions, targetFilter]
    );

    const nameToImage = useMemo(() => {
        const map = {};
        Object.values(nodeDetails || {}).forEach(nd => {
            const n = (nd?.name || "").trim();
            if (n && nd?.image && !map[n]) map[n] = nd.image;
        });
        return map;
    }, [nodeDetails]);

    const getInitials = (name = "") => {
        const parts = name.trim().split(/\s+/).filter(Boolean);
        const first = parts[0]?.[0] || "";
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
        return (first + last).toUpperCase() || (name[0]?.toUpperCase() || "?");
    };

    const clearPopup = () => {
        setConnectionSource('');
        setConnectionTarget('');
        setConnectionLabel('');
        setConnectionDirection('normal');
        setApplyMode('none');
        setPartialStartIndex("--");
        setPartialEndIndex("--");
        setShowAddConnection(false);
    }

    return (
        <div className="popup-overlay">
            <div className="popup">
                <h2>Add Connection</h2>
                <div className="two-col">
                    <div className="field">
                        <label>Source Name</label>
                        <div className="details-input relative" style={{ maxWidth: '95%' }}>
                            <input
                                ref={srcRef}
                                type="text"
                                placeholder="Type to search..."
                                value={sourceFilter}
                                onChange={(e) => { setSourceFilter(e.target.value); openDropdown("source"); }}
                                onFocus={() => openDropdown("source")}
                                onBlur={() => closeDropdownSoon("source")}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && sourceSuggestions[0]) {
                                        const v = sourceSuggestions[0];
                                        setConnectionSource(v);
                                        setSourceFilter(v);
                                        setShowDropdown(p => ({ ...p, source: false }));
                                    }
                                }}
                                className="w-full border rounded p-1"
                            />
                            {showDropdown.source && sourceSuggestions.length > 0 && (
                                <div className="dropdown-list" style={{ maxWidth: '13%' }}>
                                    {sourceSuggestions.map(opt => (
                                        <div
                                            key={opt}
                                            className="dropdown-item"
                                            onMouseDown={() => {
                                                setConnectionSource(opt);
                                                setSourceFilter(opt);
                                                setShowDropdown(p => ({ ...p, source: false }));
                                            }}
                                        >{opt}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className='connectionImage'>
                            {nameToImage[connectionSource] ? (
                                <img
                                    src={nameToImage[connectionSource]}
                                    alt={`${connectionSource || 'Source'} image`}
                                />
                            ) : (
                                <div className='imgEmpty' title={connectionSource || 'No source selected'}>
                                    {connectionSource ? getInitials(connectionSource) : '—'}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="field">
                        <label>Target Name</label>
                        <div className="details-input relative" style={{ maxWidth: '95%' }}>
                            <input
                                ref={srcRef}
                                type="text"
                                placeholder="Type to search..."
                                value={targetFilter}
                                onChange={(e) => { setTargetFilter(e.target.value); openDropdown("target"); }}
                                onFocus={() => openDropdown("target")}
                                onBlur={() => closeDropdownSoon("target")}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && targetSuggestions[0]) {
                                        const v = targetSuggestions[0];
                                        setConnectionTarget(v);
                                        setTargetFilter(v);
                                        setShowDropdown(p => ({ ...p, target: false }));
                                    }
                                }}
                                className="w-full border rounded p-1"
                            />
                            {showDropdown.target && targetSuggestions.length > 0 && (
                                <div className="dropdown-list" style={{ maxWidth: '13%' }}>
                                    {targetSuggestions.map(opt => (
                                        <div
                                            key={opt}
                                            className="dropdown-item"
                                            onMouseDown={() => {
                                                setConnectionTarget(opt);
                                                setTargetFilter(opt);
                                                setShowDropdown(p => ({ ...p, target: false }));
                                            }}
                                        >{opt}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className='connectionImage'>
                            {nameToImage[connectionTarget] ? (
                                <img
                                    src={nameToImage[connectionTarget]}
                                    alt={`${connectionTarget || 'Target'} image`}
                                />
                            ) : (
                                <div className='imgEmpty' title={connectionTarget || 'No target selected'}>
                                    {connectionTarget ? getInitials(connectionTarget) : '—'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <label>Connection Name (Label)</label>
                <input
                    type="text"
                    value={connectionLabel}
                    onChange={(e) => setConnectionLabel(e.target.value)}
                    placeholder="Optional label"
                />
                <label>Direction</label>
                <div className="connection-direction buttons">
                    {['normal', 'reverse', 'both', 'none'].map((dir) => (
                        <label key={dir} className="direction-option">
                            <input
                                type="radio"
                                value={dir}
                                checked={connectionDirection === dir}
                                onChange={(e) => setConnectionDirection(e.target.value)}
                            />
                            {dir.charAt(0).toUpperCase() + dir.slice(1)}
                        </label>
                    ))}
                </div>
                <label>Connection Level</label>
                <div className="connection-level buttons">
                    {[
                        { value: 1, label: "Normal" },
                        { value: 2, label: "Strong" },
                        { value: 0, label: "Weak" },
                    ].map(opt => (
                        <label key={opt.value} className="level-option">
                            <input
                                type="radio"
                                value={opt.value}
                                checked={connectionLevel === opt.value}
                                onChange={(e) => setConnectionLevel(parseInt(e.target.value, 10))}
                            />
                            {opt.label}
                        </label>
                    ))}
                </div>
                <label>Apply To Snapshots</label>
                <select value={applyMode} onChange={(e) => setApplyMode(e.target.value)}>
                    <option value="none">None</option>
                    <option value="forward">Fully Forward</option>
                    <option value="backward">Fully Backward</option>
                    <option value="full">Full (All Snapshots)</option>
                    <option value="partial">Partial Range</option>
                </select>
                {
                    applyMode === 'partial' && (
                        <>
                            <label>Earliest Event</label>
                            <select
                                value={partialStartIndex ?? ""}
                                onChange={(e) => setPartialStartIndex(e.target.value ? parseInt(e.target.value, 10) : null)}
                            >
                                <option value="">--</option>
                                {timelineEntries.map((entry, idx) => (
                                    <option key={idx} value={idx}>
                                        {entry.name} — {new Date(entry.timestamp).toLocaleString()}
                                    </option>
                                ))}
                            </select>
                            <label>Latest Event</label>
                            <select
                                value={partialEndIndex ?? ""}
                                onChange={(e) => setPartialEndIndex(e.target.value ? parseInt(e.target.value, 10) : null)}
                            >
                                <option value="">--</option>
                                {timelineEntries.map((entry, idx) => (
                                    <option key={idx} value={idx}>
                                        {entry.name} — {new Date(entry.timestamp).toLocaleString()}
                                    </option>
                                ))}
                            </select>
                        </>
                    )
                }
                <div className="actions">
                    <button className="cancel" onClick={() => clearPopup()}>Cancel</button>
                    <button className="confirm" onClick={() => handleAddConnection({
                        nodeDetails,
                        connectionSource,
                        connectionTarget,
                        connectionLabel,
                        connectionDirection,
                        connectionLevel,
                        editingEdgeId,
                        setEditingEdgeId,
                        setGraphData,
                        networkRef,
                        timelineEntries,
                        setTimelineEntries,
                        applyMode,
                        selectedSnapshotIndex,
                        partialStartIndex,
                        partialEndIndex,
                        clearPopup
                    })}>Add</button>
                </div>
            </div >
        </div >
    )
}
