// React Imports
import { useState, useRef, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

// Account Import
import AccountMenu from '../../accounts/components/AccountMenu.jsx';
import AccountProjects from '../../accounts/components/AccountProjects.jsx';
import AccountLogin from '../../accounts/components/AccountLogin.jsx';

// Component Imports
import NetworkGraph from './NetworkGraph.jsx';
import TimelineTrack from './TimelineTrack.jsx';
import NodeDetailsPanel from './NodeDetailsPanel.jsx';

// Popup Imports
import AddConnectionPopup from './popups/AddConnectionPopup.jsx';
import AddNodePopup from './popups/AddNodePopup.jsx';
import AddTimelineEntryPopup from './popups/AddTimelineEntryPopup.jsx';
import ConnectionContextMenu from './popups/ConnectionContextMenu.jsx';
import TickContextMenu from './popups/TickContextMenu.jsx';

// Helper Imports
import ThemeToggleSlider from '../utils/themeHelper.jsx';
import { handleUpdateSnapshot } from '../utils/timelineHelpers.jsx';
import { saveProject, loadProject } from '../utils/saveload.jsx';

// Style Import
import '../styles/master-style.css';

// Global Vars 
const SERIES_OPTIONS = ["Series A", "Series B", "Series C"];
const STATUS_OPTIONS = ["Alive", "Deceased", "Unknown"];


export default function Home() {
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [showTimelinePopup, setShowTimelinePopup] = useState(false);
  const [entryText, setEntryText] = useState("");
  const [entryType, setEntryType] = useState("event");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [entryTime, setEntryTime] = useState(() => new Date().toTimeString().slice(0, 5));
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
  const [showTickContextMenu, setShowTickContextMenu] = useState(false);
  const [tickContextMenuPosition, setTickContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedTickIndex, setSelectedTickIndex] = useState(null);
  const [timelineStartDate, setTimelineStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  });
  const [timelineEndDate, setTimelineEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  });
  const [hoveredTick, setHoveredTick] = useState(null);

  const containerRef = useRef();
  const networkRef = useRef();
  const roleInputRef = useRef(null);
  const secondaryInputRef = useRef(null);
  const nodesRef = useRef(null);
  const timelineTrackRef = useRef(null);
  const lastActiveTickRef = useRef(null);

  useEffect(() => {
    if (selectedNode && networkRef.current) {
      networkRef.current.selectNodes([selectedNode]);
    }
  }, [selectedNode]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const disableRightClick = (e) => e.preventDefault();
      container.addEventListener("contextmenu", disableRightClick);
      return () => container.removeEventListener("contextmenu", disableRightClick);
    }
  }, []);

  useEffect(() => {
    const closePopup = () => setShowTickContextMenu(false);
    if (showTickContextMenu) {
      window.addEventListener('click', closePopup);
      return () => window.removeEventListener('click', closePopup);
    }
  }, [showTickContextMenu]);

  const updateGraphData = (newData) => {
    setHistory((h) => [...h, graphData]);
    setFuture([]);
    setGraphData(newData);
  };

  const baseTime = timelineStartDate
    ? new Date(timelineStartDate).getTime()
    : (timelineEntries.length ? new Date(timelineEntries[0].timestamp).getTime() : Date.now());

  const endTime = timelineEndDate
    ? new Date(timelineEndDate).getTime()
    : (timelineEntries.length ? new Date(timelineEntries[timelineEntries.length - 1].timestamp).getTime() : baseTime + 1);

  const rangeMs = endTime - baseTime || 1;

  const timelineFrozen = showTimelinePopup || showAddPerson || showAddConnection || showEdgePopup;

  return (
    <div className="app-container">
      <NetworkGraph
        graphData={graphData}
        nodeDetails={nodeDetails}
        containerRef={containerRef}
        networkRef={networkRef}
        nodesRef={nodesRef}
        setGraphMounted={setGraphMounted}
        setSelectedNode={setSelectedNode}
        setSelectedEdgeId={setSelectedEdgeId}
        setShowEdgePopup={setShowEdgePopup}
        setEdgePopupPosition={setEdgePopupPosition}
        setIsDetailsVisible={setIsDetailsVisible}
        setJustClosedRecently={setJustClosedRecently}
      />
      <div className="header">
        <div className="header-left">
          <input type="text" placeholder="Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          <ThemeToggleSlider />
        </div>
        <div className="header-center">
          <button onClick={() => setShowAddPerson(true)} disabled={!graphMounted}>Add Node</button>
          <button className="header-button" onClick={() => setShowAddConnection(true)}>Add Connection</button>
        </div>
        <div className="header-right">
          <button onClick={() => saveProject({
            nodeDetails,
            graphData,
            timelineEntries,
            timelineStartDate,
            timelineEndDate,
            snapshots,
            projectName: "MyTimelineProject"
          })}>Save Project</button>
          <label className="file-upload-button" htmlFor="file-upload">Open Project</label>
          <input id="file-upload" type="file" accept=".zip" onChange={(e) => e.target.files.length && loadProject(e.target.files[0], {
            setProjectName,
            setTimelineEntries,
            setTimelineStartDate,
            setTimelineEndDate,
            setGraphData,
            setNodeDetails,
            setSnapshots,
          })}
          />
          <div>
            <AccountMenu />
          </div>
        </div>
      </div>
      <div className="main-content">
        <div className="top-section">
          <div className="network-area">
            <div id="network-container" ref={containerRef}></div>
          </div>
        </div>
        <div className="bottom-section">
          <div className="timeline-input" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setShowTimelinePopup(true)}>Add Event</button>
              <button onClick={() => handleUpdateSnapshot({
                selectedSnapshotIndex,
                timelineEntries,
                setTimelineEntries,
                networkRef,
                nodeDetails
              })}>Update Event</button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label>Start Date</label>
              <input type="date" value={timelineStartDate} onChange={e => setTimelineStartDate(e.target.value)} />
              <label>End Date</label>
              <input type="date" value={timelineEndDate} onChange={e => setTimelineEndDate(e.target.value)} />
            </div>
          </div>
          <div className="timeline-render-area" style={{ position: 'relative', height: '100%' }}>
            {hoveredTick && (
              <div className="hovered-tick-label" style={{ left: `${hoveredTick.left}px` }}>
                {hoveredTick.time}
              </div>
            )}
            <div className="timeline-track" ref={timelineTrackRef}>
              <TimelineTrack
                timelineEntries={timelineEntries}
                timelineStartDate={timelineStartDate}
                timelineEndDate={timelineEndDate}
                setSelectedSnapshotIndex={(index) => selectedSnapshotIndex.current = index}
                setGraphData={setGraphData}
                setNodeDetails={setNodeDetails}
                selectedTickIndex={selectedTickIndex}
                setSelectedTickIndex={setSelectedTickIndex}
                tickContextMenuPosition={tickContextMenuPosition}
                setTickContextMenuPosition={setTickContextMenuPosition}
                setShowTickContextMenu={setShowTickContextMenu}
                setHoveredTick={setHoveredTick}
                networkRef={networkRef}
                nodesRef={nodesRef}
                lastActiveTickRef={lastActiveTickRef}
                timelineTrackRef={timelineTrackRef}
                showTimelinePopup={showTimelinePopup}
                showAddPerson={showAddPerson}
                showAddConnection={showAddConnection}
                showEdgePopup={showEdgePopup}
              />
            </div>
          </div>
        </div>
      </div>
      {showAddPerson && (
        <AddNodePopup
          personName={personName}
          setPersonName={setPersonName}
          personSeries={personSeries}
          setPersonSeries={setPersonSeries}
          SERIES_OPTIONS={SERIES_OPTIONS}
          nodesRef={nodesRef}
          setGraphData={setGraphData}
          setNodeDetails={setNodeDetails}
          setConnectionLabel={setConnectionLabel}
          setConnectionDirection={setConnectionDirection}
          setShowAddPerson={setShowAddPerson}
        />
      )}
      {showAddConnection && (
        <AddConnectionPopup
          nodeDetails={nodeDetails}
          connectionSource={connectionSource}
          setConnectionSource={setConnectionSource}
          connectionTarget={connectionTarget}
          setConnectionTarget={setConnectionTarget}
          connectionLabel={connectionLabel}
          setConnectionLabel={setConnectionLabel}
          connectionDirection={connectionDirection}
          setConnectionDirection={setConnectionDirection}
          setShowAddConnection={setShowAddConnection}
          editingEdgeId={editingEdgeId}
          setEditingEdgeId={setEditingEdgeId}
          setGraphData={setGraphData}
          networkRef={networkRef}
        />
      )}


      {showEdgePopup && selectedEdgeId && (
        <ConnectionContextMenu
          edgePopupPosition={edgePopupPosition}
          networkRef={networkRef}
          selectedEdgeId={selectedEdgeId}
          setConnectionSource={setConnectionSource}
          setConnectionTarget={setConnectionTarget}
          setConnectionLabel={setConnectionLabel}
          setConnectionDirection={setConnectionDirection}
          setEditingEdgeId={setEditingEdgeId}
          setShowAddConnection={setShowAddConnection}
          setShowEdgePopup={setShowEdgePopup}
          setGraphData={setGraphData}
          setSelectedEdgeId={setSelectedEdgeId}
          nodeDetails={nodeDetails}
        />
      )}
      {(isDetailsVisible || justClosedRecently) ? (
        <NodeDetailsPanel
          setGraphData={setGraphData}
          selectedNode={selectedNode}
          nodeDetails={nodeDetails}
          setNodeDetails={setNodeDetails}
          networkRef={networkRef}
          nodesRed={nodesRef}
          setIsDetailsVisible={setIsDetailsVisible}
          setJustClosedRecently={setJustClosedRecently}
          isDetailsVisible={isDetailsVisible}
          SERIES_OPTIONS={SERIES_OPTIONS}
          STATUS_OPTIONS={STATUS_OPTIONS}
          availableRoles={availableRoles}
          setAvailableRoles={setAvailableRoles}
          availableSecondarySeries={availableSecondarySeries}
          setAvailableSecondarySeries={setAvailableSecondarySeries}
        />
      ) : null}
      {showTimelinePopup && (
        <AddTimelineEntryPopup
          entryText={entryText}
          setEntryText={setEntryText}
          entryType={entryType}
          setEntryType={setEntryType}
          entryDate={entryDate}
          setEntryDate={setEntryDate}
          entryTime={entryTime}
          setEntryTime={setEntryTime}
          networkRef={networkRef}
          graphData={graphData}
          nodeDetails={nodeDetails}
          setTimelineEntries={setTimelineEntries}
          setSnapshots={setSnapshots}
          setShowTimelinePopup={setShowTimelinePopup}
        />
      )}
      {showTickContextMenu && (
        <TickContextMenu
          tickContextMenuPosition={tickContextMenuPosition}
          selectedTickIndex={selectedTickIndex}
          setTimelineEntries={setTimelineEntries}
          timelineEntries={timelineEntries}
          setShowTickContextMenu={setShowTickContextMenu}
          selectedSnapshotIndex={selectedSnapshotIndex}
          setSelectedSnapshotIndex={setSelectedSnapshotIndex}
        />
      )}
    </div>
  );
}