// React Imports
import { useState, useRef, useEffect } from "react";

// Account Imports
import AccountMenu from "../../accounts/components/AccountMenu.jsx";
import { useProject } from "../context/ProjectContext.jsx";

// Component Imports
import ThemeToggleSlider from "../utils/themeHelper.jsx";
import CytoGraph from "./CytoGraph.jsx";
import TimelineTrack from "./TimelineTrack.jsx";
import NodeDetailsPanel from "./NodeDetailsPanel.jsx";

// Popup Imports
import ProjectSettings from "./project-settings/ProjectSettingsPopup.jsx";
import AddNodePopup from "./popups/AddNodePopup.jsx";
import AddConnectionPopup from "./popups/AddConnectionPopup.jsx";
import AddTimelineEntryPopup from "./popups/AddTimelineEntryPopup.jsx";
import { NodeContextMenu, EdgeContextMenu, TickContextMenu } from "./popups/ContextMenu.jsx";

// Helper Imports
import { pruneDeletedNodeTypes, pruneDeletedOptionsFromNodes } from "../utils/nodeHelpers.jsx";
import { saveProject } from "../../accounts/utils/SLDToCloud.jsx";

// Styles Import
import "../styles/master-style.css";

export default function Home() {
	const {
		projectName,
		setProjectName,
		graphData,
		setGraphData,
		nodeDetails,
		setNodeDetails,
		timelineEntries,
		setTimelineEntries,
		timelineStartDate,
		setTimelineStartDate,
		timelineEndDate,
		setTimelineEndDate,
		snapshots,
		setSnapshots,
		projectSettings,
		setProjectSettings,
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
	const [nodeType, setNodeType] = useState("");
	const [dropdownFilter, setDropdownFilter] = useState("");
	const [roleDropdownFilter, setRoleDropdownFilter] = useState("");
	const [showDropdown, setShowDropdown] = useState();
	const [isDetailsVisible, setIsDetailsVisible] = useState(false);
	const [justClosedRecently, setJustClosedRecently] = useState(false);
	const [isEditingName, setIsEditingName] = useState(false);
	const [showAddConnection, setShowAddConnection] = useState(false);
	const [connectionSource, setConnectionSource] = useState("");
	const [connectionTarget, setConnectionTarget] = useState("");
	const [connectionLabel, setConnectionLabel] = useState("");
	const [connectionDirection, setConnectionDirection] = useState("normal");
	const [connectionLevel, setConnectionLevel] = useState(1);
	const [selectedEdgeId, setSelectedEdgeId] = useState(null);
	const [showContextMenu, setShowContextMenu] = useState(false);
	const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
	const [contextTarget, setContextTarget] = useState(null); // {type:'node'|'edge'|'tick', id}
	const [editingEdgeId, setEditingEdgeId] = useState(null);
	const [editingTickId, setEditingTickId] = useState(null);
	const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState(null);
	const [selectedTickIndex, setSelectedTickIndex] = useState(null);
	const [hoveredTick, setHoveredTick] = useState(null);
	const [isDarkMode, setIsDarkMode] = useState(() => {
		return localStorage.getItem("theme") === "dark";
	});
	const [applyMode, setApplyMode] = useState("none");
	const [partialStartIndex, setPartialStartIndex] = useState(null);
	const [partialEndIndex, setPartialEndIndex] = useState(null);
	const [showProjectSettings, setShowProjectSettings] = useState(false);

	const containerRef = useRef();
	const cytoRef = useRef();
	const nodesRef = useRef(null);
	const timelineTrackRef = useRef(null);
	const lastActiveTickRef = useRef(null);

	useEffect(() => {
		const storedId = localStorage.getItem("currentProjectId");
		if (storedId) setCurrentProjectId(storedId);
	}, []);

	useEffect(() => {
		setProjectSettings((prev) => {
			const p = prev || {};
			return {
				...p,
				nodeTypes: Array.isArray(p.nodeTypes) ? p.nodeTypes : [],
				connectionTypes: Array.isArray(p.connectionTypes) ? p.connectionTypes : [],
				nodeStyles: p.nodeStyles ?? {
					defaultStyle: {
						color: "#888888",
						shape: "dot",
						size: 30,
						imageOpacity: 1,
					},
					rules: [], // empty to start; user adds via the CSS popup
				},
			};
		});
	}, []);

	useEffect(() => {
		if (!selectedNode || !cytoRef.current) return;
		const cyto = cytoRef.current;
		const ele = cyto.$id(String(selectedNode));
		if (ele.nonempty()) {
			cyto.batch(() => {
				cyto.$(":selected").unselect();
				ele.select();
			});
			// Prefer a light focus without jumpy fit. Adjust as you like.
			cyto.animate({ center: { eles: ele } }, { duration: 200 });
		}
	}, [selectedNode]);

	// Ensure nodeTypes array exists (editable later in "Node/Connections Types")
	useEffect(() => {
		if (!Array.isArray(projectSettings.nodeTypes)) {
			setProjectSettings((prev) => ({ ...prev, nodeTypes: [] }));
		}
	}, [projectSettings, setProjectSettings]);

	useEffect(() => {
		const container = containerRef.current;
		if (container) {
			const disableRightClick = (e) => e.preventDefault();
			container.addEventListener("contextmenu", disableRightClick);
			return () => container.removeEventListener("contextmenu", disableRightClick);
		}
	}, []);

	const baseTime = timelineStartDate
		? new Date(timelineStartDate).getTime()
		: timelineEntries.length
		? new Date(timelineEntries[0].timestamp).getTime()
		: Date.now();

	const endTime = timelineEndDate
		? new Date(timelineEndDate).getTime()
		: timelineEntries.length
		? new Date(timelineEntries[timelineEntries.length - 1].timestamp).getTime()
		: baseTime + 1;

	return (
		<div className="app-container">
			<CytoGraph
				graphData={graphData}
				nodeDetails={nodeDetails}
				projectSettings={projectSettings}
				containerRef={containerRef}
				cytoRef={cytoRef}
				nodesRef={nodesRef}
				setGraphData={setGraphData}
				setGraphMounted={setGraphMounted}
				setSelectedNode={setSelectedNode}
				setShowContextMenu={setShowContextMenu}
				setContextMenuPosition={setContextMenuPosition}
				setContextTarget={setContextTarget}
				setIsDetailsVisible={setIsDetailsVisible}
				setJustClosedRecently={setJustClosedRecently}
				isDarkMode={isDarkMode}
			/>
			<div className="header">
				<div className="header-left">
					<button onClick={() => setShowProjectSettings(true)}>Project Settings</button>
					<button
						onClick={async () => {
							const token = localStorage.getItem("token");
							await saveProject(
								{
									nodeDetails,
									graphData,
									timelineEntries,
									timelineStartDate,
									timelineEndDate,
									snapshots,
									customFields: projectSettings?.nodeFields ?? [],
									projectName: projectName || "Untitled Project",
								},
								token,
								currentProjectId
							);
						}}
					>
						Save Project
					</button>
				</div>
				<div className="header-center">
					<button onClick={() => setShowAddPerson(true)} disabled={!graphMounted}>
						Add Node
					</button>
					<button className="header-button" onClick={() => setShowAddConnection(true)}>
						Add Connection
					</button>
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
					<div className="cyto-area">
						<div id="cyto-container" ref={containerRef}></div>
						{isDetailsVisible || justClosedRecently ? (
							<NodeDetailsPanel
								setGraphData={setGraphData}
								selectedNode={selectedNode}
								nodeDetails={nodeDetails}
								setNodeDetails={setNodeDetails}
								cytoRef={cytoRef}
								setSelectedNode={setSelectedNode}
								isDetailsVisible={isDetailsVisible}
								setIsDetailsVisible={setIsDetailsVisible}
								setJustClosedRecently={setJustClosedRecently}
								timelineEntries={timelineEntries}
								setTimelineEntries={setTimelineEntries}
								selectedSnapshotIndex={selectedSnapshotIndex}
							/>
						) : null}
					</div>
				</div>
				<div className="bottom-section">
					<div
						className="timeline-input"
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							gap: "1rem",
						}}
					>
						<div style={{ display: "flex", gap: "0.5rem" }}>
							<button onClick={() => setShowTimelinePopup(true)}>Add Event</button>
						</div>
						<div
							style={{
								display: "flex",
								gap: "0.5rem",
								alignItems: "center",
							}}
						>
							<label>Start Date</label>
							<input type="date" value={timelineStartDate} onChange={(e) => setTimelineStartDate(e.target.value)} />
							<label>End Date</label>
							<input type="date" value={timelineEndDate} onChange={(e) => setTimelineEndDate(e.target.value)} />
						</div>
					</div>
					<div className="timeline-render-area" style={{ position: "relative", height: "100%" }}>
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
								setTimelineEntries={setTimelineEntries}
								graphData={graphData}
								nodeDetails={nodeDetails}
								selectedTickIndex={selectedTickIndex}
								setSelectedTickIndex={setSelectedTickIndex}
								contextMenuPosition={contextMenuPosition}
								setContextTarget={setContextTarget}
								setContextMenuPosition={setContextMenuPosition}
								setShowContextMenu={setShowContextMenu}
								setHoveredTick={setHoveredTick}
								cytoRef={cytoRef}
								nodesRef={nodesRef}
								lastActiveTickRef={lastActiveTickRef}
								timelineTrackRef={timelineTrackRef}
								setIsDetailsVisible={setIsDetailsVisible}
								setJustClosedRecently={setJustClosedRecently}
							/>
						</div>
					</div>
				</div>
			</div>
			{showProjectSettings && (
				<ProjectSettings
					projectSettings={projectSettings}
					setProjectSettings={setProjectSettings}
					cytoRef={cytoRef}
					nodeDetails={nodeDetails}
					setNodeDetails={setNodeDetails}
					onNodeTypesDeleted={pruneDeletedNodeTypes}
					projectName={projectName}
					setProjectName={setProjectName}
					onClose={() => setShowProjectSettings(false)}
					onOptionsDeleted={pruneDeletedOptionsFromNodes}
				/>
			)}
			{showAddPerson && (
				<AddNodePopup
					personName={personName}
					setPersonName={setPersonName}
					cytoRef={cytoRef}
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
					nodeType={nodeType}
					setNodeType={setNodeType}
				/>
			)}
			{showAddConnection && (
				<AddConnectionPopup
					cytoRef={cytoRef}
					nodesRef={nodesRef}
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
			{showTimelinePopup && (
				<AddTimelineEntryPopup
					cytoRef={cytoRef}
					graphData={graphData}
					entryText={entryText}
					setEntryText={setEntryText}
					entryType={entryType}
					setEntryType={setEntryType}
					entryDate={entryDate}
					setEntryDate={setEntryDate}
					entryTime={entryTime}
					setEntryTime={setEntryTime}
					nodeDetails={nodeDetails}
					setTimelineEntries={setTimelineEntries}
					setSnapshots={setSnapshots}
					setShowTimelinePopup={setShowTimelinePopup}
					timelineEntries={timelineEntries}
					setSelectedSnapshotIndex={setSelectedSnapshotIndex}
					editingTickId={editingTickId}
					setEditingTickId={setEditingTickId}
				/>
			)}
			{showContextMenu && contextTarget.type == "node" && (
				<NodeContextMenu
					position={contextMenuPosition}
					cytoRef={cytoRef}
					setShowContextMenu={setShowContextMenu}
					nodeId={contextTarget.id}
					setSelectedNode={setSelectedNode}
					setIsDetailsVisible={setIsDetailsVisible}
					setGraphData={setGraphData}
					setNodeDetails={setNodeDetails}
				/>
			)}
			{showContextMenu && contextTarget.type == "edge" && (
				<EdgeContextMenu
					position={contextMenuPosition}
					cytoRef={cytoRef}
					setShowContextMenu={setShowContextMenu}
					edgeId={contextTarget.id}
					nodeDetails={nodeDetails}
					setEditingEdgeId={setEditingEdgeId}
					setShowAddConnection={setShowAddConnection}
					setConnectionSource={setConnectionSource}
					setConnectionTarget={setConnectionTarget}
					setConnectionLabel={setConnectionLabel}
					setConnectionDirection={setConnectionDirection}
					setGraphData={setGraphData}
				/>
			)}
			{showContextMenu && contextTarget.type == "tick" && (
				<TickContextMenu
					position={contextMenuPosition}
					setShowContextMenu={setShowContextMenu}
					tickId={contextTarget.id}
					timelineEntries={timelineEntries}
					setTimelineEntries={setTimelineEntries}
					setEditingTickId={setEditingTickId}
					snapshotId={selectedSnapshotIndex}
					setSnapshotId={setSelectedSnapshotIndex}
					setShowTimelinePopup={setShowTimelinePopup}
					setEntryText={setEntryText}
					setEntryType={setEntryType}
					setEntryDate={setEntryDate}
					setEntryTime={setEntryTime}
				/>
			)}
		</div>
	);
}
