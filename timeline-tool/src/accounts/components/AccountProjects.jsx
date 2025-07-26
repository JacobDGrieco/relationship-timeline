import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadProject, deleteProject } from '../utils/SLDToCloud.jsx';
import { useProject } from '../../relatime/utils/projectContext.jsx';
import '../../styles/master-style.css';

export default function AccountProjects() {
  const { loadFromObject } = useProject();
  const [projects, setProjects] = useState([]);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [versionsCache, setVersionsCache] = useState({});
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
      localStorage.setItem('currentProjectId', projectId);
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
            {projects.map((project) => (
              <React.Fragment key={project._id}>
                <tr>
                  <td>
                    <button className="arrow-btn"
                      onClick={async () => {
                        if (expandedProjectId === project._id) {
                          setExpandedProjectId(null); // collapse
                        } else {
                          // fetch versions if not cached
                          if (!versionsCache[project._id]) {
                            const token = localStorage.getItem('token');
                            const data = await loadProject(project._id, token);
                            // remove most recent version from list
                            const history = (data.versions || []).slice(0, -1);
                            setVersionsCache((prev) => ({
                              ...prev,
                              [project._id]: history
                            }));
                          }
                          setExpandedProjectId(project._id);
                        }
                      }}
                    >
                      {expandedProjectId === project._id ? '▼' : '▶'}
                    </button>
                    {project.projectName}
                  </td>
                  <td>{new Date(project.createdAt).toLocaleString()}</td>
                  <td>{new Date(project.updatedAt).toLocaleString()}</td>
                  <td>
                    <button onClick={() => handleLoad(project._id)}>Load</button>
                    <button onClick={() => handleDelete(project._id)}>Delete</button>
                  </td>
                </tr>

                {expandedProjectId === project._id && (
                  <tr className="version-history">
                    {/* version numbers under project name column */}
                    <td>
                      {(() => {
                        const versions = (versionsCache[project._id] || []).slice().reverse();
                        return versions.map((ver, idx) => {
                          const versionNumber = versions.length - 1 - idx;
                          return (
                            <div key={idx}>
                              {`version ${versionNumber}`}
                            </div>
                          );
                        });
                      })()}
                    </td>

                    {/* savedAt under createdAt column */}
                    <td>
                      {versionsCache[project._id] &&
                        versionsCache[project._id]
                          .slice()
                          .reverse()
                          .map((ver, idx) => (
                            <div key={idx}>
                              {new Date(ver.savedAt).toLocaleString()}
                            </div>
                          ))}
                    </td>

                    {/* leave updatedAt column blank */}
                    <td></td>

                    {/* actions column: load buttons */}
                    <td>
                      {versionsCache[project._id] &&
                        versionsCache[project._id]
                          .slice()
                          .reverse()
                          .map((ver, idx) => (
                            <div key={idx}>
                              <button onClick={() => { console.log('Load version', ver); }}>Load</button>
                            </div>
                          ))}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}