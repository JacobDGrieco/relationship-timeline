// React Imports
import { useState, useRef, useEffect } from 'react';

// Account Imports
import AccountMenu from '../../accounts/components/AccountMenu.jsx';
import { useProject } from '../context/ProjectContext.jsx';

// Component Imports
import NetworkGraph from './NetworkGraph.jsx';
import TimelineTrack from './TimelineTrack.jsx';
import NodeDetailsPanel from './NodeDetailsPanel.jsx';

// Popup Imports
import ProjectSettings from './popups/ProjectSettingsPopup.jsx';
import AddConnectionPopup from './popups/AddConnectionPopup.jsx';
import AddNodePopup from './popups/AddNodePopup.jsx';
import AddTimelineEntryPopup from './popups/AddTimelineEntryPopup.jsx';
import ConnectionContextMenu from './popups/ConnectionContextMenu.jsx';
import TickContextMenu from './popups/TickContextMenu.jsx';

// Helper Imports
import ThemeToggleSlider from '../utils/themeHelper.jsx';
import { saveProject } from '../../accounts/utils/SLDToCloud.jsx';

// Style Import
import '../styles/master-style.css';

export default function Home() {
  const {
    projectName, setProjectName,
    graphData, setGraphData,
    nodeDetails, setNodeDetails,
    timelineEntries, setTimelineEntries,
    timelineStartDate, setTimelineStartDate,
    timelineEndDate, setTimelineEndDate,
    snapshots, setSnapshots,
    projectSettings, setProjectSettings
  } = useProject();
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [showTimelinePopup, setShowTimelinePopup] = useState(false);
  const [entryText, setEntryText] = useState("");
  const [entryType, setEntryType] = useState("event");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [entryTime, setEntryTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [graphMounted, setGraphMounted] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [personName, setPersonName] = useState("");
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
  const [connectionLevel, setConnectionLevel] = useState(1);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [showEdgePopup, setShowEdgePopup] = useState(false);
  const [edgePopupPosition, setEdgePopupPosition] = useState({ x: 0, y: 0 });
  const [editingEdgeId, setEditingEdgeId] = useState(null);
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState(null);
  const [showTickContextMenu, setShowTickContextMenu] = useState(false);
  const [tickContextMenuPosition, setTickContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedTickIndex, setSelectedTickIndex] = useState(null);
  const [hoveredTick, setHoveredTick] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [applyMode, setApplyMode] = useState('none');
  const [partialStartIndex, setPartialStartIndex] = useState(null);
  const [partialEndIndex, setPartialEndIndex] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const containerRef = useRef();
  const networkRef = useRef();
  const roleInputRef = useRef(null);
  const secondaryInputRef = useRef(null);
  const nodesRef = useRef(null);
  const timelineTrackRef = useRef(null);
  const lastActiveTickRef = useRef(null);

  useEffect(() => {
    const storedId = localStorage.getItem('currentProjectId');
    if (storedId) setCurrentProjectId(storedId);
  }, []);

  useEffect(() => {
    if (!projectSettings.nodeFields || projectSettings.nodeFields.length === 0) {
      setProjectSettings(prev => ({
        ...prev,
        nodeFields: [
          {
            id: 'description',
            label: 'New Field',
            type: 'description',
            order: 0,
          }
        ]
      }));
    }
  }, [projectSettings, setProjectSettings]);


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
        isDarkMode={isDarkMode}
      />
      <div className="header">
        <div className="header-left">
          <input type="text" placeholder="Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          <button onClick={async () => {
            const token = localStorage.getItem('token');
            await saveProject(
              {
                nodeDetails,
                graphData,
                timelineEntries,
                timelineStartDate,
                timelineEndDate,
                snapshots,
                customFields: customFields,
                projectName: projectName || 'Untitled Project'
              },
              token,
              currentProjectId
            );
          }}
          >Save Project</button>
          <button onClick={() => setShowSettings(true)}>Project Settings</button>
        </div>
        <div className="header-center">
          <button onClick={() => setShowAddPerson(true)} disabled={!graphMounted}>Add Node</button>
          <button className="header-button" onClick={() => setShowAddConnection(true)}>Add Connection</button>
        </div>
        <div className="header-right">
          <ThemeToggleSlider isDark={isDarkMode} setIsDark={setIsDarkMode} />
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
                selectedSnapshotIndex={selectedSnapshotIndex}
                setSelectedSnapshotIndex={setSelectedSnapshotIndex}
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
      {showSettings && (
        <ProjectSettings
          settings={projectSettings.nodeFields}
          setSettings={(newFields) => {
            setProjectSettings(prev => ({
              ...prev,
              nodeFields: newFields
            }));
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showAddPerson && (
        <AddNodePopup
          personName={personName}
          setPersonName={setPersonName}
          networkRef={networkRef}
          nodesRef={nodesRef}
          setGraphData={setGraphData}
          setNodeDetails={setNodeDetails}
          setConnectionLabel={setConnectionLabel}
          setConnectionDirection={setConnectionDirection}
          setShowAddPerson={setShowAddPerson}
          timelineEntries={timelineEntries}
          selectedSnapshotIndex={selectedSnapshotIndex}
          setTimelineEntries={setTimelineEntries}
          applyMode={applyMode}
          setApplyMode={setApplyMode}
          partialStartIndex={partialStartIndex}
          setPartialStartIndex={setPartialStartIndex}
          partialEndIndex={partialEndIndex}
          setPartialEndIndex={setPartialEndIndex}
          projectSettings={projectSettings}
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
          connectionLevel={connectionLevel}
          setConnectionLevel={setConnectionLevel}
          setShowAddConnection={setShowAddConnection}
          editingEdgeId={editingEdgeId}
          setEditingEdgeId={setEditingEdgeId}
          setGraphData={setGraphData}
          networkRef={networkRef}
          nodesRef={nodesRef}
          timelineEntries={timelineEntries}
          selectedSnapshotIndex={selectedSnapshotIndex}
          setTimelineEntries={setTimelineEntries}
          applyMode={applyMode}
          setApplyMode={setApplyMode}
          partialStartIndex={partialStartIndex}
          setPartialStartIndex={setPartialStartIndex}
          partialEndIndex={partialEndIndex}
          setPartialEndIndex={setPartialEndIndex}
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
          nodesRef={nodesRef}
          setIsDetailsVisible={setIsDetailsVisible}
          setJustClosedRecently={setJustClosedRecently}
          isDetailsVisible={isDetailsVisible}
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
          timelineEntries={timelineEntries}
          setSelectedSnapshotIndex={setSelectedSnapshotIndex}
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