import JSZip from 'jszip';

export async function saveProject({
    nodeDetails,
    graphData,
    timelineEntries,
    timelineStartDate,
    timelineEndDate,
    snapshots,
    projectName
}) {
    const zip = new JSZip();
    const cleanDetails = {};
    const images = {};
    const updatedNodeDetails = { ...nodeDetails };

    Object.entries(nodeDetails).forEach(([id, details]) => {
        if (details.image && details.image.startsWith("data:image")) {
            const imageName = `images/${id}.png`;
            images[imageName] = details.image;
            updatedNodeDetails[id] = {
                ...details,
                image: imageName,
            };
        }
    });

    for (const [id, fields] of Object.entries(nodeDetails)) {
        cleanDetails[id] = { ...fields };
        if (fields.image) {
            const base64 = fields.image.split(',')[1];
            const mime = fields.image.split(',')[0].match(/:(.*?);/)[1];
            const ext = mime.split('/')[1];
            const filename = `image_${id}.${ext}`;
            cleanDetails[id].image = `images/${filename}`;
            zip.file(`images/${filename}`, base64, { base64: true });
        }
    }

    const projectData = {
        graphData,
        nodeDetails: updatedNodeDetails,
        timelineEntries,
        timelineStartDate,
        timelineEndDate,
        snapshots,
        images
    };

    zip.file("project.json", JSON.stringify(projectData, null, 2));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName || 'project'}.zip`;
    link.click();
    URL.revokeObjectURL(url);
}

export async function loadProject(
    file,
    {
        setProjectName,
        setTimelineEntries,
        setTimelineStartDate,
        setTimelineEndDate,
        setGraphData,
        setNodeDetails,
        setSnapshots
    }
) {
    const zip = await JSZip.loadAsync(file);
    const projectText = await zip.file("project.json").async("string");
    const projectData = JSON.parse(projectText);

    const nodeDetailsWithImages = { ...projectData.nodeDetails };

    await Promise.all(
        Object.entries(nodeDetailsWithImages).map(async ([id, details]) => {
            if (details.image && details.image.startsWith("images/")) {
                const imgFile = zip.file(details.image);
                if (imgFile) {
                    const base64 = await imgFile.async("base64");
                    details.image = `data:image/*;base64,${base64}`;
                }
            }
        })
    );

    setProjectName(projectData.name || "");
    setTimelineEntries(projectData.timelineEntries || []);
    setTimelineStartDate(projectData.timelineStartDate || "");
    setTimelineEndDate(projectData.timelineEndDate || "");
    setGraphData(projectData.graphData || { nodes: [], edges: [] });
    setNodeDetails(nodeDetailsWithImages);
    setSnapshots(projectData.snapshots || []);
}