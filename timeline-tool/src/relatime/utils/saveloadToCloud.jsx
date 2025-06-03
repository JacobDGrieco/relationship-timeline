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