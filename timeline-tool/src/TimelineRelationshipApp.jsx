import { useState, useRef, useEffect, useMemo } from 'react';
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import JSZip from 'jszip';
import './TimelineRelationshipApp.css';

const SERIES_OPTIONS = ["Series A", "Series B", "Series C"];
const STATUS_OPTIONS = ["Alive", "Deceased", "Unknown"];

export default function TimelineRelationshipApp() {
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [eventText, setEventText] = useState("");
  const [eventType, setEventType] = useState("subevent");
  const [snapshots, setSnapshots] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [showTimelinePopup, setShowTimelinePopup] = useState(false);
  const [entryText, setEntryText] = useState("");
  const [entryType, setEntryType] = useState("subevent");
  const [entryDate, setEntryDate] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [zoomScale, setZoomScale] = useState(0);
  const [graphMounted, setGraphMounted] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeDetails, setNodeDetails] = useState({});
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [personName, setPersonName] = useState("");
  const [personSeries, setPersonSeries] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);
  const [availableSecondarySeries, setAvailableSecondarySeries] = useState(SERIES_OPTIONS);
  const [dropdownFilter, setDropdownFilter] = useState("");
  const [roleDropdownFilter, setRoleDropdownFilter] = useState("");
  const [showDropdown, setShowDropdown] = useState({ roles: false, secondarySeries: false });
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [justClosedRecently, setJustClosedRecently] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [connectionSource, setConnectionSource] = useState('');
  const [connectionTarget, setConnectionTarget] = useState('');
  const [connectionLabel, setConnectionLabel] = useState('');
  const [connectionDirection, setConnectionDirection] = useState('normal');
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [showEdgePopup, setShowEdgePopup] = useState(false);
  const [edgePopupPosition, setEdgePopupPosition] = useState({ x: 0, y: 0 });
  const [editingEdgeId, setEditingEdgeId] = useState(null);
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState(null);
  const [timelineStartDate, setTimelineStartDate] = useState("");
  const [timelineEndDate, setTimelineEndDate] = useState("");

  const containerRef = useRef();
  const networkRef = useRef();
  const roleInputRef = useRef(null);
  const secondaryInputRef = useRef(null);
  const nodesRef = useRef(null);
  const timelineTrackRef = useRef(null);

  const renderDropdownSuggestions = (filter, options, onSelect, show) => {
    const matches = options.filter(o => o.toLowerCase().includes(filter.toLowerCase()));
    if (!show || matches.length === 0) return null;

    return (
      <div className="dropdown-list">
        {matches.map((match) => (
          <div key={match} className="dropdown-item" onClick={() => onSelect(match)}>{match}</div>
        ))}
      </div>
    );
  };

  const renderNodeDetailForm = () => {
    if (!selectedNode) return null;
    const data = nodeDetails[selectedNode] || {};
    const currentRoles = data.roles || [];
    const currentSecondaries = data.secondarySeries || [];

    const handleRoleKeyDown = (e, field, availableSetter) => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        const newValue = e.target.value.trim();
        const updated = [...new Set([...(nodeDetails[selectedNode]?.[field] || []), newValue])];
        handleNodeFieldChange(field, updated);

        if (field === 'roles') {
          if (!availableRoles.includes(newValue)) {
            const updatedRoles = [...availableRoles, newValue].sort((a, b) => a.localeCompare(b));
            availableSetter(updatedRoles);
          }
        }

        if (field === 'secondarySeries') {
          if (!availableSecondarySeries.includes(newValue)) {
            availableSetter([...availableSecondarySeries, newValue]); // No sort needed here unless you want it
          }
        }

        if (field === 'roles') {
          setRoleDropdownFilter('');
          setShowDropdown(prev => ({ ...prev, roles: false }));
          if (roleInputRef.current) roleInputRef.current.blur();
        }

        if (field === 'secondarySeries') {
          setDropdownFilter('');
          setShowDropdown(prev => ({ ...prev, secondarySeries: false }));
          if (secondaryInputRef.current) secondaryInputRef.current.blur();
        }

        e.target.value = '';
        e.preventDefault();
      }
    };

    const handleRemoveValue = (field, value, available, availableSetter) => {
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
    };

    const handleNodeFieldChange = (field, value) => {
      setNodeDetails(prev => ({
        ...prev,
        [selectedNode]: {
          ...prev[selectedNode],
          [field]: value
        }
      }));
    };

    const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageData = reader.result;

          handleNodeFieldChange('image', imageData);

          networkRef.current.body.data.nodes.update({
            id: selectedNode,
            image: imageData,
            shape: 'circularImage',
          });
        };
        reader.readAsDataURL(file);
      }
    };


    const addSuggestion = (field, value, available, setter) => {
      if (!value.trim()) return;

      const current = nodeDetails[selectedNode]?.[field] || [];
      if (current.includes(value)) return;

      handleNodeFieldChange(field, [...current, value]);

      if (!available.includes(value)) {
        const updated = [...available, value];
        if (field === 'roles') {
          updated.sort((a, b) => a.localeCompare(b));
          console.log('Sorted Roles:', updated);
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
    };

    const filteredRoles = availableRoles.filter((o) =>
      o.toLowerCase().includes(roleDropdownFilter.toLowerCase())
    );

    const filteredSecondarySeries = availableSecondarySeries.filter((o) =>
      o.toLowerCase().includes(dropdownFilter.toLowerCase())
    );

    if (!isDetailsVisible && !justClosedRecently) return null;

    return (
      <div className={`slide-pane ${isDetailsVisible ? 'visible' : 'hidden'}`}>
        <button
          className="close-details-button"
          onClick={() => {
            setIsDetailsVisible(false);
            setTimeout(() => setJustClosedRecently(false), 300); // Matches CSS animation
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
                    // Update state
                    setNodeDetails(prev => ({
                      ...prev,
                      [selectedNode]: {
                        ...prev[selectedNode],
                        name: newName,
                      },
                    }));

                    // Update vis-network label
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

        {/* 1. Image Upload */}
        <div className="details-row">
          <label className="details-label">Image</label>
          <div className="details-input">
            <label className="file-upload-label">
              Upload Image
              <input type="file" className="file-upload-input" accept="image/*" onChange={handleImageUpload} />
            </label>
            {data.image && <div className="file-name">Image uploaded</div>}
          </div>
        </div>

        {/* 2. Primary Series */}
        <div className="details-row">
          <label className="details-label">Primary Series</label>
          <select
            className="details-input"
            value={data.primarySeries || ''}
            onChange={(e) => handleNodeFieldChange('primarySeries', e.target.value)}
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
              placeholder="Type and press Enter"
              onKeyDown={(e) => handleRoleKeyDown(e, 'secondarySeries', setAvailableSecondarySeries)}
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
                    onMouseDown={() => addSuggestion('secondarySeries', option, availableSecondarySeries, setAvailableSecondarySeries)}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
            <div className="tag-container">
              {currentSecondaries.map((val) => (
                <span className="tag cursor-pointer" key={val} onClick={() =>
                  handleRemoveValue('secondarySeries', val, availableSecondarySeries, setAvailableSecondarySeries)
                }>{val}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Status */}
        <div className="details-row">
          <label className="details-label">Status</label>
          <select
            className="details-input"
            value={data.status || 'Alive'}
            onChange={(e) => handleNodeFieldChange('status', e.target.value)}
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
              onKeyDown={(e) => handleRoleKeyDown(e, 'roles', setAvailableRoles)}
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
                  handleRemoveValue('roles', val, availableRoles, setAvailableRoles)
                }>{val}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };


  useEffect(() => {
    if (selectedNode && networkRef.current) {
      networkRef.current.selectNodes([selectedNode]);
    }
  }, [selectedNode]);

  useEffect(() => {
    const processedNodes = graphData.nodes.map(node => {
      if (node.image) {
        return { ...node, shape: 'circularImage' };
      }
      return { ...node, shape: 'dot' };
    });

    const nodes = new DataSet(processedNodes);
    const edges = new DataSet(graphData.edges);
    nodesRef.current = nodes;
    setGraphMounted(true);

    const data = { nodes, edges };
    const options = {
      physics: {
        enabled: true,
        solver: "repulsion",
        repulsion: {
          nodeDistance: 150,
          centralGravity: 0.1,
          springLength: 200,
          springConstant: 0.05,
          damping: 0.09
        },
        stabilization: {
          iterations: 100,
          fit: true
        }
      },
      layout: {
        improvedLayout: true
      },
      nodes: {
        shape: "dot",
        size: 40,
        font: { size: 14, color: "#333" },
        borderWidth: 2,
      },
      edges: {
        width: 2,
        color: { color: "#888" },
        arrows: {
          to: { enabled: true, scaleFactor: 1 }
        },
        font: { align: "top" },
      }
    };


    if (containerRef.current) {
      networkRef.current = new Network(containerRef.current, data, options);
      networkRef.current.on("click", function (params) {
        if (params.nodes.length === 1) {
          const nodeId = params.nodes[0];
          setSelectedNode(nodeId);
          setIsDetailsVisible(true);
          setJustClosedRecently(true);
        }
      });
      networkRef.current.on("click", function (params) {
        if (params.edges.length === 1) {
          const edgeId = params.edges[0];
          const edge = networkRef.current.body.data.edges.get(edgeId);

          const pointer = params.pointer.DOM;
          setSelectedEdgeId(edgeId);
          setShowEdgePopup(true);
          setEdgePopupPosition({ x: pointer.x, y: pointer.y });
        } else {
          setShowEdgePopup(false);
          setSelectedEdgeId(null);
        }
      });
    }
  }, [graphData]);

  const updateGraphData = (newData) => {
    setHistory((h) => [...h, graphData]);
    setFuture([]);
    setGraphData(newData);
  };

  const handleNodeFieldChange = (field, value) => {
    const updatedDetails = {
      ...nodeDetails,
      [selectedNode]: {
        ...nodeDetails[selectedNode],
        [field]: value
      }
    };
    setNodeDetails(updatedDetails);

    if (field === 'image') {
      const updatedNodes = graphData.nodes.map(node =>
        node.id === selectedNode ? { ...node, image: value, shape: 'circularImage' } : node
      );
      setGraphData({ ...graphData, nodes: updatedNodes });
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleNodeFieldChange('image', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const generateUniqueId = () => {
    return 'node-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };

  const handleAddPerson = () => {
    const id = generateUniqueId();
    const label = personName || `Node ${id}`;

    const newNode = {
      id,
      label,
    };

    nodesRef.current.add(newNode);

    setGraphData(prev => ({
      nodes: [...prev.nodes, newNode],
      edges: [...prev.edges]
    }));

    setNodeDetails(prev => ({
      ...prev,
      [id]: {
        name: personName,
        primarySeries: personSeries,
        roles: [],
        secondarySeries: [],
        status: 'Alive',
      },
    }));

    setPersonName('');
    setPersonSeries('');
    setConnectionLabel('');
    setConnectionDirection('normal');
    setShowAddPerson(false);
  };

  const getArrowDirection = (direction) => {
    switch (direction) {
      case 'normal':
        return { to: { enabled: true } };
      case 'reverse':
        return { from: { enabled: true } };
      case 'both':
        return { to: { enabled: true }, from: { enabled: true } };
      case 'none':
      default:
        return { to: { enabled: false }, from: { enabled: false } };
    }
  };

  const getArrowDirectionLabel = (arrows) => {
    const from = arrows?.from?.enabled;
    const to = arrows?.to?.enabled;

    if (from && to) return 'both';
    if (from) return 'reverse';
    if (to) return 'normal';
    return 'none';
  };


  const handleAddConnection = () => {
    const allNodeDetails = Object.entries(nodeDetails);

    const sourceEntry = allNodeDetails.find(([, data]) => data.name === connectionSource);
    const targetEntry = allNodeDetails.find(([, data]) => data.name === connectionTarget);

    if (!sourceEntry || !targetEntry) {
      alert('One or both node names not found.');
      return;
    }

    const fromId = sourceEntry[0];
    const toId = targetEntry[0];

    const updatedEdge = {
      from: fromId,
      to: toId,
      label: connectionLabel,
      arrows: getArrowDirection(connectionDirection)
    };

    if (editingEdgeId) {
      updatedEdge.id = editingEdgeId;
      networkRef.current.body.data.edges.update(updatedEdge);

      setGraphData(prev => ({
        ...prev,
        edges: prev.edges.map(edge =>
          edge.id === editingEdgeId ? { ...updatedEdge } : edge
        )
      }));
      setEditingEdgeId(null);
    } else {
      const id = generateUniqueId();
      updatedEdge.id = id;

      networkRef.current.body.data.edges.add(updatedEdge);

      setGraphData(prev => ({
        ...prev,
        edges: [...prev.edges, updatedEdge]
      }));
    }

    setConnectionSource('');
    setConnectionTarget('');
    setConnectionLabel('');
    setConnectionDirection('normal');
    setShowAddConnection(false);
  };

  const deleteEdge = (edgeId) => {
    networkRef.current.body.data.edges.remove({ id: edgeId });

    setGraphData(prev => ({
      nodes: [...prev.nodes],
      edges: prev.edges.filter(edge => edge.id !== edgeId)
    }));

    setShowEdgePopup(false);
    setSelectedEdgeId(null);
  };


  const loadProjectZip = async (file) => {
    const zip = await JSZip.loadAsync(file);
    const projectText = await zip.file("project.json").async("string");
    const projectData = JSON.parse(projectText);

    const nodeDetailsWithImages = { ...projectData.nodeDetails };

    await Promise.all(
      Object.entries(nodeDetailsWithImages).map(async ([id, details]) => {
        if (details.image && details.image.startsWith("images/")) {
          const imgFile = zip.file(details.image);
          if (imgFile) {
            const base64 = await imgFile.async("base64");
            details.image = `data:image/*;base64,${base64}`;
          }
        }
      })
    );

    setProjectName(projectData.name || "");
    setEvents(projectData.events || []);
    setGraphData(projectData.graphData || { nodes: [], edges: [] });
    setNodeDetails(nodeDetailsWithImages);
    setSnapshots(projectData.snapshots || []);
  };

  const getLeftOffset = (timestamp) => {
    if (!timelineEntries.length) return 0;

    const baseTime = new Date(timelineEntries[0].timestamp).getTime();
    const currentTime = new Date(timestamp).getTime();

    const elapsed = currentTime - baseTime;
    return Math.round(elapsed * zoomScale);
  };


  const saveProject = async () => {
    const zip = new JSZip();
    const cleanDetails = {};
    const images = {};
    const updatedNodeDetails = { ...nodeDetails };

    Object.entries(nodeDetails).forEach(([id, details]) => {
      if (details.image && details.image.startsWith("data:image")) {
        const imageName = `images/${id}.png`;
        images[imageName] = details.image;
        updatedNodeDetails[id] = {
          ...details,
          image: imageName,
        };
      }
    });

    for (const [id, fields] of Object.entries(nodeDetails)) {
      cleanDetails[id] = { ...fields };
      if (fields.image) {
        const base64 = fields.image.split(',')[1];
        const mime = fields.image.split(',')[0].match(/:(.*?);/)[1];
        const ext = mime.split('/')[1];
        const filename = `image_${id}.${ext}`;
        cleanDetails[id].image = `images/${filename}`;
        zip.file(`images/${filename}`, base64, { base64: true });
      }
    }

    const projectData = {
      graphData,
      nodeDetails: updatedNodeDetails,
      events,
      snapshots,
      images
    };

    zip.file("project.json", JSON.stringify(projectData, null, 2));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName || 'project'}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const baseTime = timelineStartDate
    ? new Date(timelineStartDate).getTime()
    : (timelineEntries.length ? new Date(timelineEntries[0].timestamp).getTime() : Date.now());

  const endTime = timelineEndDate
    ? new Date(timelineEndDate).getTime()
    : (timelineEntries.length ? new Date(timelineEntries[timelineEntries.length - 1].timestamp).getTime() : baseTime + 1);

  const rangeMs = endTime - baseTime || 1;
  const fullWidth = timelineTrackRef.current?.offsetWidth || 1000;

  const timelineFrozen = showTimelinePopup || showAddPerson || showAddConnection || showEdgePopup;
  const timelineTicks = useMemo(() => {
    if (timelineFrozen) return null;

    const startTime = new Date(new Date(timelineStartDate).setHours(0, 0, 0, 0)).getTime();
    const stopTime = new Date(new Date(timelineEndDate).setHours(23, 59, 59, 999)).getTime();
    const range = stopTime - startTime || 1;

    return timelineEntries.map((entry, idx) => {
      const entryTime = new Date(entry.timestamp).getTime();
      const leftPx = ((entryTime - startTime) / range) * (fullWidth - 100) + 25;
      const inView = entryTime >= startTime && entryTime <= stopTime;

      return (
        <div
          key={idx}
          className={`timeline-tick ${entry.type}`}
          style={{ left: `${leftPx}px`, opacity: inView ? 1 : 0.15, pointerEvents: inView ? 'auto' : 'none' }}
          onClick={() => {
            const snapshot = entry.snapshot;
            setGraphData(snapshot.graphData);
            setNodeDetails(snapshot.nodeDetails);
            setSelectedSnapshotIndex(idx);
            nodesRef.current.clear();
            nodesRef.current.add(snapshot.graphData.nodes);
            networkRef.current.body.data.edges.clear();
            networkRef.current.body.data.edges.add(snapshot.graphData.edges);
          }}>
          <div className="tick-line" />
          <div className="tick-label">{entry.text}</div>
        </div>
      );
    });
  }, [timelineEntries, timelineStartDate, timelineEndDate, fullWidth, timelineFrozen]);

  return (
    <div className="app-container">
      <div className="header">
        <div className="header-left">
          <input type="text" placeholder="Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          <div className="theme-toggle">
            <label className="toggle-wrapper">
              <input
                type="checkbox"
                onChange={(e) => {
                  document.body.classList.toggle("dark", e.target.checked);
                }}
              />
              <span className="slider-thumb"></span>
            </label>
          </div>
        </div>
        <div className="header-center">
          <button onClick={() => setShowAddPerson(true)} disabled={!graphMounted}>Add Person</button>
          <button className="header-button" onClick={() => setShowAddConnection(true)}>Add Connection</button>
        </div>
        <div className="header-right">
          <button onClick={saveProject}>Save Project</button>
          <label className="file-upload-button" htmlFor="file-upload">Open Project</label>
          <input id="file-upload" type="file" accept=".zip" onChange={(e) => e.target.files.length && loadProjectZip(e.target.files[0])} />
        </div>
      </div>

      <div className="main-content">
        <div className="top-section">
          <div className="network-area">
            <div id="network-container" ref={containerRef}></div>
            {renderNodeDetailForm()}
          </div>
        </div>
        <div className="bottom-section">
          <div className="timeline-input" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setShowTimelinePopup(true)}>Add Entry</button>
              <button onClick={() => {
                if (selectedSnapshotIndex !== null && timelineEntries[selectedSnapshotIndex]) {
                  const updated = [...timelineEntries];
                  updated[selectedSnapshotIndex].snapshot = {
                    graphData: {
                      nodes: networkRef.current.body.data.nodes.get(),
                      edges: networkRef.current.body.data.edges.get(),
                    },
                    nodeDetails: JSON.parse(JSON.stringify(nodeDetails))
                  };
                  setTimelineEntries(updated);
                }
              }}>Update Snapshot</button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label>Start Date</label>
              <input type="date" value={timelineStartDate} onChange={e => setTimelineStartDate(e.target.value)} />
              <label>End Date</label>
              <input type="date" value={timelineEndDate} onChange={e => setTimelineEndDate(e.target.value)} />
            </div>
          </div>
          <div
            className="timeline-track"
            ref={timelineTrackRef}
            onWheel={(e) => {
              e.preventDefault();

              if (e.altKey) {
                const direction = e.deltaY > 0 ? -1 : 1;
                const scaleFactor = 1 + direction * 0.1;

                const container = e.currentTarget;
                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left + container.scrollLeft;

                const newScale = Math.min(0.2, Math.max(0.005, zoomScale * scaleFactor));
                const timeAtCursor = mouseX / zoomScale;
                const newScrollLeft = timeAtCursor * newScale - (e.clientX - rect.left);

                setZoomScale(newScale);
                setTimeout(() => {
                  container.scrollLeft = newScrollLeft;
                }, 0);
              } else {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
          >
            <TimelineRuler
              baseTime={baseTime}
              endTime={endTime}
              zoomScale={zoomScale}
            />
            {timelineTicks}
          </div>
        </div>
      </div>
      {showAddPerson && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Add Person</h2>
            <label>Name</label>
            <input type="text" value={personName} onChange={(e) => setPersonName(e.target.value)} />
            <label>Series</label>
            <select
              value={personSeries}
              onChange={(e) => setPersonSeries(e.target.value)}
              className="popup-dropdown"
            >
              <option value="">Select a series</option>
              {SERIES_OPTIONS.map((series) => (
                <option key={series} value={series}>
                  {series}
                </option>
              ))}
            </select>

            <div className="actions">
              <button className="cancel" onClick={() => setShowAddPerson(false)}>Cancel</button>
              <button className="confirm" onClick={handleAddPerson}>Add</button>
            </div>
          </div>
        </div>
      )}
      {showAddConnection && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Add Connection</h2>
            <label>Source Name</label>
            <input
              type="text"
              value={connectionSource}
              onChange={(e) => setConnectionSource(e.target.value)}
              placeholder="Enter source node name"
            />
            <label>Target Name</label>
            <input
              type="text"
              value={connectionTarget}
              onChange={(e) => setConnectionTarget(e.target.value)}
              placeholder="Enter target node name"
            />
            <label>Connection Name (Label)</label>
            <input
              type="text"
              value={connectionLabel}
              onChange={(e) => setConnectionLabel(e.target.value)}
              placeholder="Optional label"
            />
            <label>Direction</label>
            <div className="connection-direction">
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
            <div className="actions">
              <button className="cancel" onClick={() => setShowAddConnection(false)}>Cancel</button>
              <button className="confirm" onClick={handleAddConnection}>Add</button>
            </div>
          </div>
        </div>
      )}
      {showEdgePopup && selectedEdgeId && (
        <div className="edge-popup" style={{ top: edgePopupPosition.y, left: edgePopupPosition.x }}>
          <button onClick={() => {
            const edge = networkRef.current.body.data.edges.get(selectedEdgeId);
            const sourceName = nodeDetails[edge.from]?.name || '';
            const targetName = nodeDetails[edge.to]?.name || '';

            setConnectionSource(sourceName);
            setConnectionTarget(targetName);
            setConnectionLabel(edge.label || '');
            setConnectionDirection(getArrowDirectionLabel(edge.arrows));
            setEditingEdgeId(selectedEdgeId);
            setShowAddConnection(true);
            setShowEdgePopup(false);
          }}>Edit</button>
          <button className="delete-button" onClick={() => deleteEdge(selectedEdgeId)}>Delete</button>
        </div>
      )}
      {showTimelinePopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Add Timeline Entry</h2>
            <label>Entry Name</label>
            <input
              type="text"
              value={entryText}
              onChange={(e) => setEntryText(e.target.value)}
              placeholder="e.g. Character Introduced"
            />
            <label>Type</label>
            <select value={entryType} onChange={(e) => setEntryType(e.target.value)}>
              <option value="event">Event</option>
              <option value="subevent">Subevent</option>
            </select>
            <label>Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />
            <label>Time</label>
            <input
              type="time"
              value={entryTime}
              onChange={(e) => setEntryTime(e.target.value)}
            />
            <div className="actions">
              <button className="cancel" onClick={() => setShowTimelinePopup(false)}>Cancel</button>
              <button className="confirm" onClick={() => {
                if (!entryText.trim() || !entryDate) return;
                const timestamp = new Date(`${entryDate}T${entryTime || "00:00"}`).toISOString();

                const snapshot = {
                  graphData: {
                    nodes: networkRef.current.body.data.nodes.get(),
                    edges: JSON.parse(JSON.stringify(graphData.edges))
                  },
                  nodeDetails: JSON.parse(JSON.stringify(nodeDetails))
                };

                setTimelineEntries(prev => [
                  ...prev,
                  { type: entryType, text: entryText, timestamp, snapshot }
                ]);
                setSnapshots(prev => [...prev, snapshot]);
                setShowTimelinePopup(false);
                setEntryText("");
                setEntryType("subevent");
                setEntryDate("");
                setEntryTime("");
              }}>Add Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TimelineRuler = ({ baseTime, endTime, zoomScale }) => {
  if (!baseTime || !endTime) return null;

  const tickInterval = 3600000; // 1 hour
  const ticks = [];

  for (let t = baseTime; t <= endTime + tickInterval; t += tickInterval) {
    const left = Math.round((t - baseTime) * zoomScale);
    ticks.push(left);
  }

  return (
    <div className="timeline-ruler">
      {ticks.map((tick, idx) => (
        <div key={idx} className="ruler-tick" style={{ left: `${tick.left}px` }}>
          <div className="ruler-line" />
          <div className="ruler-label">{tick.label}</div>
        </div>
      ))}
    </div>
  );
};
