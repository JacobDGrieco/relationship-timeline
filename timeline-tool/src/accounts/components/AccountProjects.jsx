import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadProject } from '../utils/saveloadToCloud.jsx';
import { useProject } from '../../relatime/utils/projectContext.jsx';
import '../styles/regular-mode/AccountProjects.css';

export default function AccountProjects() {
  const {
    setProjectName,
    setGraphData,
    setNodeDetails,
    setTimelineEntries,
    setTimelineStartDate,
    setTimelineEndDate,
    setSnapshots
  } = useProject();

  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("No token found in localStorage.");
        return;
      }

      try {
        const res = await fetch('http://localhost:4000/api/project/load', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Failed to fetch projects:", errorText);
          return;
        }

        const data = await res.json();
        setProjects(data);
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };

    fetchProjects();
  }, []);


  const handleDelete = async (projectId) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:4000/api/project/delete/${projectId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    setProjects(projects.filter(p => p._id !== projectId));
  };

  const handleLoad = async (projectId) => {
    try {
      const token = localStorage.getItem('token'); // or useContext(AuthContext)
      const data = await loadProject(projectId, token);

      setProjectName(data.projectName);
      setGraphData(data.graphData);
      setNodeDetails(data.nodeDetails);
      setTimelineEntries(data.timelineEntries);
      setTimelineStartDate(data.timelineStartDate);
      setTimelineEndDate(data.timelineEndDate);
      setSnapshots(data.snapshots);

      navigate('/');
    } catch (err) {
      console.error("Failed to load project:", err);
    }
  };

  return (
    <div className="saved-projects-wrapper">
      <div className="saved-projects-container">
        <h1>Saved Projects</h1>
        <table className="project-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project._id}>
                <td>{project.projectName}</td>
                <td>{new Date(project.createdAt).toLocaleString()}</td>
                <td>{new Date(project.updatedAt).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleLoad(project._id)}>Load</button>
                  <button onClick={() => handleDelete(project._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}