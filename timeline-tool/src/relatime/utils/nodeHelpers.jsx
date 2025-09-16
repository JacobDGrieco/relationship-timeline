import { generateUniqueID } from "./graphHelpers";
import { handleUpdateSnapshots, createSnapshot } from "./timelineHelpers";

const _imgAlphaCache = new Map();
const _imgMaskCache = new Map();

export function handleAddPerson({
	personName,
	nodesRef,
	setGraphData,
	setNodeDetails,
	timelineEntries,
	setTimelineEntries,
	applyMode,
	selectedSnapshotIndex,
	partialStartIndex,
	partialEndIndex,
	networkRef,
	nodeDetails,
	projectSettings,
	nodeType,
	clearPopup,
}) {
	const id = generateUniqueID();
	const label = personName || `Node ${id}`;
	const newNode = { id, label, type: nodeType || "Default" };

	nodesRef.current.add(newNode);
	setGraphData((prev) => ({
		nodes: [...prev.nodes, newNode],
		edges: [...prev.edges],
	}));

	const baseDetails = { name: personName, type: nodeType || "Default" };
	if (Array.isArray(projectSettings) && projectSettings.length) {
		for (const f of projectSettings) {
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
			networkRef,
			nodeDetails: next,
		});
		return next;
	});

	clearPopup();
}

// Remove a node and all its connected edges from graph + vis dataset
export function handleDeleteNode(networkRef, nodeId, setGraphData) {
	if (!networkRef?.current || !nodeId) return;

	const net = networkRef.current;
	const connectedEdgeIds = net.getConnectedEdges(nodeId) || [];

	// Remove from vis DataSets
	net.body.data.nodes.remove({ id: nodeId });
	connectedEdgeIds.forEach((eid) => {
		net.body.data.edges.remove({ id: eid });
	});

	// Reflect in React graphData state
	setGraphData((prev) => ({
		nodes: prev.nodes.filter((n) => n.id !== nodeId),
		edges: prev.edges.filter((e) => !connectedEdgeIds.includes(e.id) && e.from !== nodeId && e.to !== nodeId),
	}));
}

export function handleNodeFieldChange(
	nodeId,
	field,
	value,
	setNodeDetails,
	{ networkRef, timelineEntries, setTimelineEntries, selectedSnapshotIndex } = {}
) {
	setNodeDetails((prev) => {
		const next = {
			...prev,
			[nodeId]: {
				...prev[nodeId],
				[field]: value,
			},
		};

		// Overwrite the CURRENT snapshot so switching events keeps these changes
		if (
			networkRef?.current &&
			Array.isArray(timelineEntries) &&
			typeof selectedSnapshotIndex === "number" &&
			timelineEntries[selectedSnapshotIndex]
		) {
			setTimelineEntries((prevTE) => {
				const copy = [...prevTE];
				const fresh = createSnapshot(networkRef, { edges: networkRef.current.body.data.edges.get() }, next);
				copy[selectedSnapshotIndex] = { ...copy[selectedSnapshotIndex], snapshot: fresh };
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
	{ networkRef, timelineEntries, setTimelineEntries, selectedSnapshotIndex } = {}
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

			// 2) Update details from the freshest state and snapshot with the same object
			setNodeDetails((prev) => {
				const next = {
					...prev,
					[selectedNode]: {
						...prev[selectedNode],
						image: normalized,
					},
				};

				// Overwrite the CURRENT snapshot so switching events keeps the image
				if (
					networkRef?.current &&
					Array.isArray(timelineEntries) &&
					typeof selectedSnapshotIndex === "number" &&
					timelineEntries[selectedSnapshotIndex]
				) {
					setTimelineEntries((prevTE) => {
						const copy = [...prevTE];
						const fresh = createSnapshot(networkRef, { edges: networkRef.current.body.data.edges.get() }, next);
						copy[selectedSnapshotIndex] = { ...copy[selectedSnapshotIndex], snapshot: fresh };
						return copy;
					});
				}

				return next;
			});

			// 3) Update the vis node immediately
			setGraphData((prev) => {
				const updatedNodes = prev.nodes.map((node) =>
					node.id === selectedNode ? { ...node, shape: "circularImage", image: normalized } : node
				);
				return { ...prev, nodes: updatedNodes };
			});
		};
		img.src = e.target.result;
	};

	reader.readAsDataURL(file);
}

export function addValueToArrayField({
	nodeId,
	fieldId,
	value,
	setNodeDetails,
	networkRef,
	timelineEntries,
	setTimelineEntries,
	selectedSnapshotIndex,
}) {
	const v = (value ?? "").trim();
	if (!v) return;
	setNodeDetails((prev) => {
		const current = prev[nodeId]?.[fieldId] || [];
		if (current.includes(v)) return prev;

		const next = {
			...prev,
			[nodeId]: { ...prev[nodeId], [fieldId]: [...current, v] },
		};

		if (
			networkRef?.current &&
			Array.isArray(timelineEntries) &&
			typeof selectedSnapshotIndex === "number" &&
			timelineEntries[selectedSnapshotIndex]
		) {
			setTimelineEntries((prevTE) => {
				const copy = [...prevTE];
				const fresh = createSnapshot(networkRef, { edges: networkRef.current.body.data.edges.get() }, next);
				copy[selectedSnapshotIndex] = { ...copy[selectedSnapshotIndex], snapshot: fresh };
				return copy;
			});
		}
		return next;
	});
}

export function removeValueFromArrayField({
	nodeId,
	fieldId,
	value,
	setNodeDetails,
	networkRef,
	timelineEntries,
	setTimelineEntries,
	selectedSnapshotIndex,
}) {
	setNodeDetails((prev) => {
		const current = prev[nodeId]?.[fieldId] || [];
		const next = {
			...prev,
			[nodeId]: { ...prev[nodeId], [fieldId]: current.filter((x) => x !== value) },
		};

		if (
			networkRef?.current &&
			Array.isArray(timelineEntries) &&
			typeof selectedSnapshotIndex === "number" &&
			timelineEntries[selectedSnapshotIndex]
		) {
			setTimelineEntries((prevTE) => {
				const copy = [...prevTE];
				const fresh = createSnapshot(networkRef, { edges: networkRef.current.body.data.edges.get() }, next);
				copy[selectedSnapshotIndex] = { ...copy[selectedSnapshotIndex], snapshot: fresh };
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

export function pruneDeletedNodeTypes(deletedTypes, replacementType, setNodeDetails, nodeDetails, networkRef) {
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

	// Mirror change onto vis nodes (for future shape logic)
	try {
		const net = networkRef.current;
		if (net?.body?.data?.nodes) {
			const updates = [];
			for (const [nodeId, details] of Object.entries(nodeDetails)) {
				const t = details?.type;
				if (t && deleted.has(t)) {
					updates.push({ id: nodeId, type: fallback });
				}
			}
			if (updates.length) net.body.data.nodes.update(updates);
		}
	} catch {
		/* no-op */
	}
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

export function computeNodeVisFromSettings({ node, details, projectSettings }) {
	const nc = projectSettings?.nodeStyles || {};
	const base = {
		shape: nc?.defaultStyle?.shape ?? "dot",
		size: nc?.defaultStyle?.size ?? 30,
		color: nc?.defaultStyle?.color ?? "#888",
		imageOpacity: Number.isFinite(nc?.defaultStyle?.imageOpacity) ? nc.defaultStyle.imageOpacity : 1,
	};

	const rules = Array.isArray(nc?.rules) ? nc.rules : [];
	let style = { ...base };

	for (const r of rules) {
		if (ruleMatches(r?.match, details)) {
			style = { ...style, ...r.style };
		}
	}

	// Build vis-network node props
	const out = {
		shape: style.shape || "dot",
		size: style.size || 30,
		color: {
			background: style.color || "#888",
			border: style.color || "#888",
			highlight: { background: style.color || "#fff6a3", border: "yellow" },
		},
	};

	// Images: use circularImage if an image exists or if explicitly requested;
	// apply opacity if specified (<1).
	const src = details?.image || null;
	if (src && (out.shape === "circularImage" || style.shape === "circularImage")) {
		out.shape = "circularImage";
		const alpha = clamp01(style.imageOpacity ?? 1);
		out.image = alpha >= 0.999 ? src : getImageWithOpacity(src, alpha);
	} else if (!src && out.shape === "circularImage") {
		// no image: use a clean circle
		out.shape = "dot";
	} else if (src && out.shape !== "circularImage") {
		// ✅ Any non-circularImage shape with an image:
		// pre-compose the image into the desired shape and feed it to `shape: "image"`
		const dim = Math.max(24, (style.size || 30) * 2); // pixel footprint
		const alpha = clamp01(style.imageOpacity ?? 1);
		const masked = getMaskedImage(src, out.shape, dim, alpha, style.color, 2);
		out.shape = "image";
		out.image = masked;
		// Fix the footprint so it doesn’t hug the label
		out.widthConstraint = dim;
		out.heightConstraint = dim;
		// keep a bit of margin around the label
		out.margin = 5;
	}

	const labelBased = new Set(["box", "ellipse", "database", "text"]);
	if (labelBased.has(out.shape)) {
		const dim = Math.max(24, (style.size || 30) * 2); // tweak factor as you like
		out.widthConstraint = dim; // fixed width
		out.heightConstraint = dim; // fixed height (ellipse becomes a true circle-like ellipse)
		out.margin = 5;
	}

	return out;
}

// --- mask the image into a polygon/rect/ellipse and add an optional border
function getMaskedImage(src, shape, dim, opacity, strokeColor = "#888", strokeWidth = 2) {
	const key = `${src}|${shape}|${dim}|${opacity}|${strokeColor}|${strokeWidth}`;
	const cached = _imgMaskCache.get(key);
	if (cached) return cached;

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	canvas.width = dim;
	canvas.height = dim;

	// Build path for desired shape
	ctx.save();
	drawShapePath(ctx, shape, dim);
	ctx.clip();

	// Draw the image to cover the area
	const img = new Image();
	img.src = src;
	// If the image isn't decoded yet, just fall back once; next render can cache the masked one.
	if (!img.complete || !img.width || !img.height) {
		return src;
	}
	if (img.width && img.height) {
		const scale = Math.max(dim / img.width, dim / img.height);
		const w = img.width * scale,
			h = img.height * scale;
		ctx.globalAlpha = opacity;
		ctx.drawImage(img, (dim - w) / 2, (dim - h) / 2, w, h);
	}
	ctx.restore();

	// Optional border
	if (strokeWidth > 0) {
		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = strokeWidth;
		drawShapePath(ctx, shape, dim);
		ctx.stroke();
	}

	const out = canvas.toDataURL("image/png");
	_imgMaskCache.set(key, out);
	return out;
}

function drawShapePath(ctx, shape, dim) {
	const r = dim / 2,
		cx = r,
		cy = r;
	ctx.beginPath();
	switch (shape) {
		case "square":
		case "box":
			ctx.rect(0, 0, dim, dim);
			break;
		case "ellipse":
			ctx.ellipse(cx, cy, r, r * 0.8, 0, 0, Math.PI * 2);
			break;
		case "diamond":
			ctx.moveTo(cx, 0);
			ctx.lineTo(dim, cy);
			ctx.lineTo(cx, dim);
			ctx.lineTo(0, cy);
			ctx.closePath();
			break;
		case "triangle":
			regularPolygon(ctx, 3, cx, cy, r * 0.95, -Math.PI / 2);
			break;
		case "triangleDown":
			regularPolygon(ctx, 3, cx, cy, r * 0.95, Math.PI / 2);
			break;
		case "hexagon":
			regularPolygon(ctx, 6, cx, cy, r * 0.95, 0);
			break;
		case "star":
			starPath(ctx, cx, cy, r * 0.95, r * 0.45, 5);
			break;
		case "database":
			// Simple cylinder-ish: ellipse top + rect + ellipse bottom
			ctx.ellipse(cx, cy - r * 0.6, r, r * 0.35, 0, 0, Math.PI * 2);
			ctx.rect(cx - r, cy - r * 0.6, dim, r * 1.2);
			ctx.ellipse(cx, cy + r * 0.6, r, r * 0.35, 0, 0, Math.PI * 2);
			break;
		default: // circle
			ctx.arc(cx, cy, r, 0, Math.PI * 2);
	}
	ctx.closePath?.();
}

function regularPolygon(ctx, n, cx, cy, r, rot = 0) {
	for (let i = 0; i < n; i++) {
		const a = rot + (i * 2 * Math.PI) / n;
		const x = cx + r * Math.cos(a);
		const y = cy + r * Math.sin(a);
		i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
	}
	ctx.closePath();
}

function starPath(ctx, cx, cy, rOuter, rInner, points) {
	for (let i = 0; i < points * 2; i++) {
		const r = i % 2 === 0 ? rOuter : rInner;
		const a = -Math.PI / 2 + (i * Math.PI) / points;
		const x = cx + r * Math.cos(a);
		const y = cy + r * Math.sin(a);
		i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
	}
	ctx.closePath();
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

function clamp01(n) {
	return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 1));
}

function getImageWithOpacity(src, opacity) {
	const key = `${src}|${opacity}`;
	const cached = _imgAlphaCache.get(key);
	if (cached) return cached;

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	const img = new Image();
	// Important for dataURL: no crossOrigin needed; for remote images you would need proper CORS.
	img.src = src;

	// NOTE: synchronous return won't work; we must return a cached or precomputed result.
	// For simplicity in this code path, we assume "src" is from FileReader/dataURL (your app already uses that).
	// Render immediately (image likely already decoded in memory), but still guard on dimensions:
	// If width/height are 0 (not decoded yet), just return src and a later render cycle will cache it.
	if (!img.width || !img.height) return src;

	canvas.width = img.width;
	canvas.height = img.height;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.globalAlpha = opacity;
	ctx.drawImage(img, 0, 0);
	const out = canvas.toDataURL("image/png");
	_imgAlphaCache.set(key, out);
	return out;
}
