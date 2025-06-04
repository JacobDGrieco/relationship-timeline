import React, { createContext, useContext, useState } from 'react';

const ProjectContext = createContext();

const now = new Date();
const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

export function ProjectProvider({ children }) {
  const [projectName, setProjectName] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [nodeDetails, setNodeDetails] = useState({});
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [timelineStartDate, setTimelineStartDate] = useState(defaultStart);
  const [timelineEndDate, setTimelineEndDate] = useState(defaultEnd);
  const [snapshots, setSnapshots] = useState([]);

  const loadFromObject = (data) => {
    setProjectName(data.projectName || '');
    setGraphData(data.graphData || { nodes: [], edges: [] });
    setNodeDetails(data.nodeDetails || {});
    setTimelineEntries(data.timelineEntries || []);
    setTimelineStartDate(data.timelineStartDate || '');
    setTimelineEndDate(data.timelineEndDate || '');
    setSnapshots(data.snapshots || []);
  };

  return (
    <ProjectContext.Provider value={{
      projectName, setProjectName,
      graphData, setGraphData,
      nodeDetails, setNodeDetails,
      timelineEntries, setTimelineEntries,
      timelineStartDate, setTimelineStartDate,
      timelineEndDate, setTimelineEndDate,
      snapshots, setSnapshots,
      loadFromObject
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);

function loadAllProjectData(data) {
  setProjectName(data.name || 'Untitled Project');
  setGraphData(data.graphData || { nodes: [], edges: [] });
  setNodeDetails(data.nodeDetails || {});
  setTimelineEntries(data.timelineEntries || []);
  setTimelineStartDate(data.timelineStartDate || '');
  setTimelineEndDate(data.timelineEndDate || '');
  setSnapshots(data.snapshots || []);
}