import { useState, useRef, useEffect } from 'react';
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import JSZip from 'jszip';
import './TimelineRelationshipApp.css';

const SERIES_OPTIONS = ["Series A", "Series B", "Series C"];
const STATUS_OPTIONS = ["Alive", "Deceased", "Unknown"];

export default function TimelineRelationshipApp() {
  const [events, setEvents] = useState([]);
  const [eventText, setEventText] = useState("");
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [projectName, setProjectName] = useState("");
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
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

  const containerRef = useRef();
  const networkRef = useRef();
  const roleInputRef = useRef(null);
  const secondaryInputRef = useRef(null);


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
        const updated = [...new Set([...(data[field] || []), newValue])];
        handleNodeFieldChange(field, updated);

        if (field === 'roles' && !availableRoles.includes(newValue)) {
          availableSetter(prev => [...new Set([...prev, newValue])]);
        }

        if (field === 'secondarySeries' && !availableSecondarySeries.includes(newValue)) {
          availableSetter(prev => [...new Set([...prev, newValue])]);
        }

        // Hide dropdown and blur input field
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
          handleNodeFieldChange('image', reader.result);
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
        setter([...available, value]);
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

        <div className="details-content">
          <h3 className="text-lg font-bold mb-2">Node {selectedNode} Details</h3>

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
              <option value="">Select a series</option>
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
                      key={option}
                      className="dropdown-item"
                      onMouseDown={() => addSuggestion('roles', option, availableRoles, setAvailableRoles)}
                    >
                      {option}
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
      </div>
    );
  };

  useEffect(() => {
    const processedNodes = graphData.nodes.map(node => {
      if (node.shape === 'circularImage' && !node.image) {
        return { ...node, shape: 'dot' };
      }
      return node;
    });

    const nodes = new DataSet(processedNodes);
    const edges = new DataSet(graphData.edges);
    const data = { nodes, edges };
    const options = {
      physics: false,
      height: "100%",
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
      },
      layout: {
        improvedLayout: true
      }
    };

    if (containerRef.current) {
      networkRef.current = new Network(containerRef.current, data, options);
      networkRef.current.on("click", function (params) {
        if (params.nodes.length === 1) {
          const nodeId = params.nodes[0]; // ✅ Get the actual clicked node ID
          setSelectedNode(nodeId);
          setIsDetailsVisible(true);
          setJustClosedRecently(true);
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

  const handleAddPerson = () => {
    if (!personName.trim()) return;
    const id = graphData.nodes.length + 1;
    const newNode = { id, label: personName };
    updateGraphData({ ...graphData, nodes: [...graphData.nodes, newNode] });
    setNodeDetails({
      ...nodeDetails,
      [id]: { series: personSeries }
    });
    setPersonName("");
    setPersonSeries("");
    setShowAddPerson(false);
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
    setHistory([]);
    setFuture([]);
    setSnapshots([]);
  };

  const saveProject = async () => {
    const zip = new JSZip();
    const cleanDetails = {};

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
      name: projectName,
      events,
      graphData,
      nodeDetails: cleanDetails
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
          <button onClick={() => setShowAddPerson(true)}>Add Person</button>
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
          <div className="timeline-input">
            <input type="text" value={eventText} onChange={(e) => setEventText(e.target.value)} placeholder="New event..." />
            <button onClick={() => {
              if (!eventText.trim()) return;
              const timestamp = new Date().toISOString();
              const snapshot = JSON.parse(JSON.stringify(graphData));
              setEvents([...events, { text: eventText, timestamp }]);
              setSnapshots([...snapshots, snapshot]);
              setEventText("");
            }}>Add Event</button>
          </div>
          {events.map((event, idx) => (
            <div key={idx} className="timeline-event" onClick={() => setGraphData(snapshots[idx])}>
              <strong>{new Date(event.timestamp).toLocaleString()}:</strong> {event.text}
            </div>
          ))}
        </div>
      </div>
      {showAddPerson && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Add Person</h2>
            <label>Name</label>
            <input type="text" value={personName} onChange={(e) => setPersonName(e.target.value)} />
            <label>Series</label>
            <input type="text" value={personSeries} onChange={(e) => setPersonSeries(e.target.value)} />
            <div className="actions">
              <button className="cancel" onClick={() => setShowAddPerson(false)}>Cancel</button>
              <button className="confirm" onClick={handleAddPerson}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}