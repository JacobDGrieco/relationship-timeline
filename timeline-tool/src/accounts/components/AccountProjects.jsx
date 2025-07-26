import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadProject, deleteProject } from '../utils/SLDToCloud.jsx';
import { useProject } from '../../relatime/utils/projectContext.jsx';
import '../../styles/master-style.css';

export default function AccountProjects() {
  const { loadFromObject } = useProject();
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:4000/api/project/load', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch projects: ${text}`);
        }

        const data = await res.json();
        setProjects(data);
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };
    fetchProjects();
  }, []);

  const handleLoad = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      const data = await loadProject(projectId, token);
      loadFromObject(data);
      navigate('/');
    } catch (err) {
      console.error("Failed to load project:", err);
    }
  };

  const handleDelete = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      await deleteProject(projectId, token);  // 🔥 call your delete helper
      // After successful delete, update UI
      setProjects((prevProjects) => prevProjects.filter(p => p._id !== projectId));
    } catch (err) {
      console.error("Failed to delete project:", err);
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