import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/regular-mode/AccountProjects.css';

export default function AccountProjects() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('http://localhost:4000/api/project/load', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      setProjects(data);
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

  const handleLoad = (project) => {
    localStorage.setItem('loadedProject', JSON.stringify(project));
    navigate('/');
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
                  <button onClick={() => handleLoad(project)}>Load</button>
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