import { createContext, useContext, useState } from 'react';

const ProjectContext = createContext();

export const useProject = () => useContext(ProjectContext);

export function ProjectProvider({ children }) {
  const [projectName, setProjectName] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [nodeDetails, setNodeDetails] = useState({});
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [timelineStartDate, setTimelineStartDate] = useState('');
  const [timelineEndDate, setTimelineEndDate] = useState('');
  const [snapshots, setSnapshots] = useState([]);

  return (
    <ProjectContext.Provider value={{
      projectName, setProjectName,
      graphData, setGraphData,
      nodeDetails, setNodeDetails,
      timelineEntries, setTimelineEntries,
      timelineStartDate, setTimelineStartDate,
      timelineEndDate, setTimelineEndDate,
      snapshots, setSnapshots
    }}>
      {children}
    </ProjectContext.Provider>
  );
}