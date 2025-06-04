export async function saveProject(projectData) {
  const token = localStorage.getItem('token');

  const response = await fetch('http://localhost:4000/api/project/save', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(projectData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to save project');
  }

  return data;
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