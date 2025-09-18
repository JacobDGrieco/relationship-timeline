import { generateUniqueID } from "./graphHelpers.jsx";
import { handleUpdateSnapshots } from "./timelineHelpers.jsx";

export function handleAddPerson({
	personName,
	cytoRef,
	nodesRef,
	setGraphData,
	setNodeDetails,
	timelineEntries,
	setTimelineEntries,
	applyMode,
	selectedSnapshotIndex,
	partialStartIndex,
	partialEndIndex,
	nodeDetails,
	projectSettings,
	nodeType,
	clearPopup,
}) {
	const id = generateUniqueID();
	const label = personName || `Node ${id}`;
	const ext = cytoRef?.current?.extent?.();
	const cx = ext ? ext.x1 + ext.w / 2 : 0;
	const cy = ext ? ext.y1 + ext.h / 2 : 0;
	const newNode = { id, label, type: nodeType || "Default", x: Math.round(cx), y: Math.round(cy) };

	setGraphData((prev) => ({ nodes: [...prev.nodes, newNode], edges: [...prev.edges] }));

	const baseDetails = { name: personName, type: nodeType || "Default" };
	const fields = Array.isArray(projectSettings?.nodeFields) ? projectSettings.nodeFields : [];
	if (fields.length) {
		for (const f of fields) {
			if (!(f?.id in baseDetails)) {
				baseDetails[f.id] = f.type === "image-upload" ? null : f.type === "static-multiselect" || f.type === "dynamic-multiselect" ? [] : "";
			}
		}
	}

	setNodeDetails((prev) => {
		const next = { ...prev, [id]: baseDetails };
		handleUpdateSnapshots(newNode, "node", {
			applyMode,
			selectedSnapshotIndex,
			partialStartIndex,
			partialEndIndex,
			timelineEntries,
			setTimelineEntries,
			nodeDetails: next,
		});
		return next;
	});

	clearPopup();
}

// Remove a node and all its connected edges from graph + state
export function handleDeleteNode(_cytoRef, nodeId, setGraphData, setNodeDetails) {
	if (!nodeId) return;
	setGraphData((prev) => ({
		nodes: prev.nodes.filter((n) => n.id !== nodeId),
		edges: prev.edges.filter((e) => e.source !== nodeId && e.target !== nodeId && e.from !== nodeId && e.to !== nodeId),
	}));
	setNodeDetails?.((prev) => {
		if (!prev) return prev;
		const next = { ...prev };
		delete next[nodeId];
		return next;
	});
}

export function handleNodeFieldChange(nodeId, field, value, setNodeDetails, { timelineEntries, setTimelineEntries, selectedSnapshotIndex } = {}) {
	setNodeDetails((prev) => {
		const next = {
			...prev,
			[nodeId]: {
				...prev[nodeId],
				[field]: value,
			},
		};

		// Overwrite the CURRENT snapshot so switching events keeps these changes
		if (Array.isArray(timelineEntries) && typeof selectedSnapshotIndex === "number" && timelineEntries[selectedSnapshotIndex]) {
			setTimelineEntries((prevTE) => {
				const copy = [...prevTE];
				const snap = copy[selectedSnapshotIndex]?.snapshot ?? { graphData: { nodes: [], edges: [] }, nodeDetails: {} };
				copy[selectedSnapshotIndex] = { ...copy[selectedSnapshotIndex], snapshot: { ...snap, nodeDetails: next } };
				return copy;
			});
		}

		return next;
	});
}

export function handleImageUpload(
	selectedNode,
	file,
	setNodeDetails,
	setGraphData,
	{ timelineEntries, setTimelineEntries, selectedSnapshotIndex } = {}
) {
	if (!file || !selectedNode) return;

	const reader = new FileReader();
	reader.onload = function (e) {
		const img = new Image();
		img.onload = function () {
			// 1) Center-crop to a square, then scale to a fixed canvas (uniform output)
			const side = Math.min(img.width, img.height);
			const sx = (img.width - side) / 2;
			const sy = (img.height - side) / 2;

			const CANVAS_SIZE = 256;
			const canvas = document.createElement("canvas");
			canvas.width = CANVAS_SIZE;
			canvas.height = CANVAS_SIZE;
			const ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
			ctx.drawImage(img, sx, sy, side, side, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

			const normalized = canvas.toDataURL("image/png");

			// 2) Update details (image as data URL) and snapshot with same object
			setNodeDetails((prev) => {
				const next = {
					...prev,
					[selectedNode]: {
						...prev[selectedNode],
						image: normalized,
					},
				};

				// Overwrite the CURRENT snapshot so switching events keeps the image
				if (Array.isArray(timelineEntries) && typeof selectedSnapshotIndex === "number" && timelineEntries[selectedSnapshotIndex]) {
					setTimelineEntries((prevTE) => {
						const copy = [...prevTE];
						const snap = copy[selectedSnapshotIndex]?.snapshot ?? { graphData: { nodes: [], edges: [] }, nodeDetails: {} };
						copy[selectedSnapshotIndex] = { ...copy[selectedSnapshotIndex], snapshot: { ...snap, nodeDetails: next } };
						return copy;
					});
				}

				return next;
			});
		};
		img.src = e.target.result;
	};

	reader.readAsDataURL(file);
}

export function addValueToArrayField({ nodeId, fieldId, value, setNodeDetails, timelineEntries, setTimelineEntries, selectedSnapshotIndex }) {
	const v = (value ?? "").trim();
	if (!v) return;
	setNodeDetails((prev) => {
		const current = prev[nodeId]?.[fieldId] || [];
		if (current.includes(v)) return prev;

		const next = {
			...prev,
			[nodeId]: { ...prev[nodeId], [fieldId]: [...current, v] },
		};

		if (Array.isArray(timelineEntries) && typeof selectedSnapshotIndex === "number" && timelineEntries[selectedSnapshotIndex]) {
			setTimelineEntries((prevTE) => {
				const copy = [...prevTE];
				const snap = copy[selectedSnapshotIndex]?.snapshot ?? { graphData: { nodes: [], edges: [] }, nodeDetails: {} };
				copy[selectedSnapshotIndex] = { ...copy[selectedSnapshotIndex], snapshot: { ...snap, nodeDetails: next } };
				return copy;
			});
		}
		return next;
	});
}

export function removeValueFromArrayField({ nodeId, fieldId, value, setNodeDetails, timelineEntries, setTimelineEntries, selectedSnapshotIndex }) {
	setNodeDetails((prev) => {
		const current = prev[nodeId]?.[fieldId] || [];
		const next = {
			...prev,
			[nodeId]: { ...prev[nodeId], [fieldId]: current.filter((x) => x !== value) },
		};

		if (Array.isArray(timelineEntries) && typeof selectedSnapshotIndex === "number" && timelineEntries[selectedSnapshotIndex]) {
			setTimelineEntries((prevTE) => {
				const copy = [...prevTE];
				const snap = copy[selectedSnapshotIndex]?.snapshot ?? { graphData: { nodes: [], edges: [] }, nodeDetails: {} };
				copy[selectedSnapshotIndex] = { ...copy[selectedSnapshotIndex], snapshot: { ...snap, nodeDetails: next } };
				return copy;
			});
		}
		return next;
	});
}

// For dynamic-multiselect: suggest from field.options (minus already-selected), filtered.
export function getSuggestions(field, selectedValues = [], filterText = "") {
	const f = (filterText || "").toLowerCase();
	const selected = new Set(selectedValues);
	return (field.options || []).filter((opt) => opt.toLowerCase().includes(f) && !selected.has(opt));
}

// On Enter in a dynamic input, add the value and fire optional afterAdd callback.
export function handleEnterAddToArrayField(e, { nodeId, fieldId, setNodeDetails, afterAdd }) {
	if (e.key !== "Enter") return;

	e.preventDefault();
	const raw = e.currentTarget.value;
	const val = (raw ?? "").trim();
	if (!val) return;

	addValueToArrayField({ nodeId, fieldId, value: val, setNodeDetails });
	if (typeof afterAdd === "function") afterAdd(val);
	e.currentTarget.value = "";
}

// Persist a value into projectSettings.nodeFields[*].options (idempotent)
export function promoteOptionToProjectSettings(setProjectSettings, fieldId, value) {
	const v = (value ?? "").trim();
	if (!v) return;

	setProjectSettings((prev) => {
		if (!prev?.nodeFields) return prev;
		const nodeFields = prev.nodeFields.map((f) => {
			if (f.id !== fieldId) return f;
			const opts = Array.isArray(f.options) ? f.options : [];
			if (opts.includes(v)) return f;
			const next = Array.from(new Set([...opts, v])).sort((a, b) => a.localeCompare(b));
			return { ...f, options: next };
		});
		return { ...prev, nodeFields };
	});
}

export function pruneDeletedNodeTypes(deletedTypes, replacementType, setNodeDetails, nodeDetails, _cytoRef) {
	if (!Array.isArray(deletedTypes) || deletedTypes.length === 0) return;
	const deleted = new Set(deletedTypes);
	const fallback = replacementType || "Default";

	// Update nodeDetails
	setNodeDetails((prev) => {
		if (!prev) return prev;
		let changed = false;
		const next = { ...prev };
		for (const [nodeId, details] of Object.entries(prev)) {
			const t = details?.type;
			if (t && deleted.has(t)) {
				next[nodeId] = { ...details, type: fallback };
				changed = true;
			}
		}
		return changed ? next : prev;
	});
}

// Remove deleted multiselect options from every node for a specific field
export function pruneDeletedOptionsFromNodes(fieldId, deletedValues, setNodeDetails) {
	if (!Array.isArray(deletedValues) || deletedValues.length === 0) return;
	const deleted = new Set(deletedValues);
	setNodeDetails((prev) => {
		if (!prev) return prev;
		let changed = false;
		const next = { ...prev };
		for (const [nodeId, details] of Object.entries(prev)) {
			const arr = details?.[fieldId];
			if (!Array.isArray(arr) || arr.length === 0) continue;
			const keep = arr.filter((v) => !deleted.has(v));
			if (keep.length !== arr.length) {
				next[nodeId] = { ...details, [fieldId]: keep };
				changed = true;
			}
		}
		return changed ? next : prev;
	});
}

function ruleMatches(match, details) {
	if (!match) return false;
	if (match.mode === "type") {
		const t = details?.type || "Default";
		return t === match.type;
	}
	if (match.mode === "field") {
		const name = match.fieldName;
		// fieldName can be label or id; try both
		const val = details?.[name] ?? details?.[idFromLabel(name)];
		const s = valToString(val);
		if (match.op === "equals") return s === String(match.value ?? "");
		if (match.op === "contains") return s.toLowerCase().includes(String(match.value ?? "").toLowerCase());
		if (match.op === "in") {
			const arr = Array.isArray(match.value) ? match.value : [];
			return arr.some((v) => s === String(v));
		}
	}
	return false;
}

function idFromLabel(labelish) {
	return labelish;
} // adjust if your fields use separate ids vs labels

function valToString(v) {
	if (Array.isArray(v)) return v.join(", ");
	if (v == null) return "";
	return String(v);
}
