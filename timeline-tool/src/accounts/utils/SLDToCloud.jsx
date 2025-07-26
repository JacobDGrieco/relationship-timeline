export async function saveProject(projectData, token, projectId) {
  try {
    const body = {
      ...projectData
    };
    if (projectId) {
      body._id = projectId; // include if updating
    }

    const res = await fetch('http://localhost:4000/api/project/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error('Failed to save project');
    return await res.json();
  } catch (err) {
    console.error('Error saving project:', err);
    throw err;
  }
}


export async function loadProject(projectId, token) {
  try {
    const res = await fetch(`http://localhost:4000/api/project/load/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Failed to load project");

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error loading project:", err);
    throw err;
  }
}

export async function deleteProject(projectId, token) {
  try {
    const res = await fetch(`http://localhost:4000/api/project/delete/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Failed to delete project");

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error deleting project:", err);
    throw err;
  }
}
