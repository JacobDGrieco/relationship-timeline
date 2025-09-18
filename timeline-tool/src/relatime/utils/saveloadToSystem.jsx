import JSZip from "jszip";

export async function saveProject({ nodeDetails, graphData, timelineEntries, timelineStartDate, timelineEndDate, snapshots, projectName }) {
	const zip = new JSZip();
	const cleanDetails = {};
	for (const [id, fields] of Object.entries(nodeDetails)) {
		cleanDetails[id] = { ...fields };
		if (fields.image && fields.image.startsWith("data:")) {
			const [, meta, b64] = fields.image.match(/^data:(.*?);base64,(.+)$/) || [];
			if (meta && b64) {
				const ext = (meta.split("/")[1] || "png").split("+")[0];
				const filename = `images/image_${id}.${ext}`;
				cleanDetails[id].image = filename;
				zip.file(filename, b64, { base64: true });
			}
		}
	}

	const projectData = {
		projectName,
		graphData,
		nodeDetails: cleanDetails,
		timelineEntries,
		timelineStartDate,
		timelineEndDate,
		snapshots,
	};

	zip.file("project.json", JSON.stringify(projectData, null, 2));
	const blob = await zip.generateAsync({ type: "blob" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${projectName || "project"}.zip`;
	link.click();
	URL.revokeObjectURL(url);
}

export async function loadProject(
	file,
	{ setProjectName, setTimelineEntries, setTimelineStartDate, setTimelineEndDate, setGraphData, setNodeDetails, setSnapshots }
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

	setProjectName(projectData.projectName || "");
	setTimelineEntries(projectData.timelineEntries || []);
	setTimelineStartDate(projectData.timelineStartDate || "");
	setTimelineEndDate(projectData.timelineEndDate || "");
	setGraphData(projectData.graphData || { nodes: [], edges: [] });
	setNodeDetails(nodeDetailsWithImages);
	setSnapshots(projectData.snapshots || []);
}
