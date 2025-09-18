import { useEffect, useMemo } from "react";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import dagre from "cytoscape-dagre";

cytoscape.use(fcose);
cytoscape.use(dagre);

export default function CytoGraph({
	graphData,
	nodeDetails,
	projectSettings,
	containerRef,
	cytoRef,
	nodesRef,
	setGraphData,
	setGraphMounted,
	setSelectedNode,
	setShowContextMenu,
	setContextMenuPosition,
	setContextTarget,
	setIsDetailsVisible,
	setJustClosedRecently,
	isDarkMode,
}) {
	const styleJson = useMemo(() => {
		const def = projectSettings?.nodeStyles?.defaultStyle || {};
		const shapeMap = { dot: "ellipse", box: "round-rectangle", square: "round-rectangle", database: "round-rectangle", circularImage: "ellipse" };
		const defShape = shapeMap[def.shape] || def.shape || "ellipse";
		const rules = Array.isArray(projectSettings?.nodeStyles?.rules) ? projectSettings.nodeStyles.rules : [];
		const s = [
			{
				selector: "node",
				style: {
					width: def.size ?? 50,
					height: def.size ?? 50,
					"background-color": def.color ?? "#888",
					shape: defShape,
					label: "data(label)",
					"font-size": 10,
					color: isDarkMode ? "#fff" : "#333",
					"text-valign": "bottom",
					"text-halign": "center",
					"text-margin-y": 6,
					"overlay-opacity": 0,
				},
			},
			{
				selector: "node[?image]",
				style: {
					"background-image": "data(image)",
					"background-fit": "cover",
					"background-clip": "node",
					"background-opacity": "data(imageOpacity)",
				},
			},
			{ selector: "node:selected", style: { "border-width": 3, "border-color": "yellow" } },
			{
				selector: "edge",
				style: {
					width: "data(width)",
					"line-color": "#888",
					"curve-style": "bezier",
					"source-arrow-shape": "data(sourceArrow)",
					"target-arrow-shape": "data(targetArrow)",
					"source-arrow-color": "#888",
					"target-arrow-color": "#888",
					label: "data(label)",
					"font-size": 10,
					"text-background-color": isDarkMode ? "#111" : "#fff",
					"text-background-opacity": 0.6,
					"text-rotation": "autorotate",
					"line-style": "data(lineStyle)",
				},
			},
			{ selector: "edge:selected", style: { "line-color": "yellow", "target-arrow-color": "yellow", width: 3 } },
		];
		for (const r of rules) {
			if (r?.match?.type && r?.style) {
				const shape = shapeMap[r.style.shape] || r.style.shape;
				const override = {};
				if (Number.isFinite(r.style.size)) {
					override.width = r.style.size;
					override.height = r.style.size;
				}
				if (r.style.color) override["background-color"] = r.style.color;
				if (shape) override.shape = shape;
				if (Object.keys(override).length) s.push({ selector: `node[type = "${r.match.type}"]`, style: override });
			}
		}
		return s;
	}, [projectSettings, isDarkMode]);

	const getSpatialHood = (cy, centerNodes, radius = 240) => {
		let nodes = cy.collection();
		centerNodes.forEach((n) => {
			const p = n.position();
			const near = cy.nodes().filter((nd) => {
				if (nd.same(n)) return false;
				const q = nd.position();
				const dx = q.x - p.x,
					dy = q.y - p.y;
				return dx * dx + dy * dy <= radius * radius;
			});
			nodes = nodes.union(near).union(n);
		});
		const edges = nodes.edgesWith(nodes);
		return nodes.union(edges);
	};

	const runLocalRepel = (cy, centerNodes) => {
		const eles = getSpatialHood(cy, centerNodes, 180);
		if (!eles || eles.empty()) return;
		const layout = cy.layout({
			name: "cola",
			eles,
			avoidOverlap: true,
			nodeSpacing: 16,
			randomize: true,
			animate: true,
			fit: false,
			maxSimulationTime: 1200,
		});
		layout.run();
		// persist updated positions so the next render keeps them
		if (typeof setGraphData === "function") {
			const pos = {};
			eles.nodes().forEach((n) => {
				const p = n.position();
				pos[n.id()] = p;
			});
			setGraphData((prev) => ({
				...prev,
				nodes: prev.nodes.map((nd) => (pos[nd.id] ? { ...nd, x: pos[nd.id].x, y: pos[nd.id].y } : nd)),
			}));
		}
	};

	const pushNeighbors = (cy, centerNodes, { radius = 220, maxPush = 44 } = {}) => {
		if (!cy || !centerNodes || centerNodes.empty?.() || centerNodes.empty()) return;
		const updates = {};
		centerNodes.forEach((c) => {
			const p = c.position();
			const near = cy.nodes().filter((n) => {
				if (n.same(c)) return false;
				const q = n.position();
				const dx = q.x - p.x,
					dy = q.y - p.y;
				return dx * dx + dy * dy <= radius * radius;
			});
			near.forEach((n) => {
				const q = n.position();
				let dx = q.x - p.x,
					dy = q.y - p.y;
				let dist = Math.hypot(dx, dy);
				if (!dist) {
					// same spot: tiny random nudge
					dx = Math.random() - 0.5;
					dy = Math.random() - 0.5;
					dist = Math.hypot(dx, dy);
				}
				dx /= dist;
				dy /= dist;
				// push scales up as they get closer (0..1), capped by maxPush
				const t = Math.max(0, (radius - dist) / radius);
				const push = t * maxPush;
				const nx = q.x + dx * push;
				const ny = q.y + dy * push;
				updates[n.id()] = { x: nx, y: ny };
			});
		});
		// apply to cy + persist to app state
		cy.batch(() => {
			for (const id in updates) {
				cy.getElementById(id)?.position(updates[id]);
			}
		});
		if (typeof setGraphData === "function") {
			setGraphData((prev) => ({
				...prev,
				nodes: prev.nodes.map((nd) => (updates[nd.id] ? { ...nd, x: updates[nd.id].x, y: updates[nd.id].y } : nd)),
			}));
		}
	};

	// INIT ONCE
	useEffect(() => {
		if (!containerRef.current) return;
		const cyto = cytoscape({
			container: containerRef.current,
			elements: [],
			wheelSensitivity: 1,
			style: styleJson,
		});

		// Keep a flag to avoid running 'cola' on bulk syncs
		cyto.scratch("_suppressAddLayout", false);

		// Local repel when a *new* node is added (but not during bulk updates)
		cyto.on("add", "node", (evt) => {
			if (cyto.scratch("_suppressAddLayout")) return;
			const n = evt.target;
			pushNeighbors(cyto, cyto.collection(n));
		});

		// Persist positions when a node is dropped
		if (typeof setGraphData === "function") {
			cyto.on("dragfree", "node", (evt) => {
				const n = evt.target,
					p = n.position(),
					id = n.id();
				setGraphData((prev) => ({
					...prev,
					nodes: prev.nodes.map((nd) => (nd.id === id ? { ...nd, x: p.x, y: p.y } : nd)),
				}));
			});
		}

		// Context + selection handlers (unchanged)
		cyto.on("cxttap", "node", (evt) => {
			const node = evt.target;
			cyto.$(":selected").unselect();
			node.select();
			setContextTarget({ type: "node", id: node.id() });
			setContextMenuPosition({ x: evt.originalEvent.clientX, y: evt.originalEvent.clientY });
			setShowContextMenu(true);
		});
		cyto.on("cxttap", "edge", (evt) => {
			const edge = evt.target;
			cyto.$(":selected").unselect();
			edge.select();
			setContextTarget({ type: "edge", id: edge.id() });
			setContextMenuPosition({ x: evt.originalEvent.clientX, y: evt.originalEvent.clientY });
			setShowContextMenu(true);
		});
		cyto.on("cxttap", (evt) => {
			if (evt.target === cyto) {
				cyto.$(":selected").unselect();
				setShowContextMenu(false);
				setContextTarget(null);
			}
		});
		cyto.on("tap", "node", (evt) => {
			const node = evt.target;
			cyto.$(":selected").unselect();
			node.select();
			setSelectedNode(node.id());
			setIsDetailsVisible(true);
			setJustClosedRecently(true);
			setShowContextMenu(false);
			setContextTarget(null);
		});
		cyto.on("tap", "edge", (evt) => {
			cyto.$(":selected").unselect();
			evt.target.select();
			setIsDetailsVisible(false);
			setSelectedNode(null);
			setShowContextMenu(false);
			setContextTarget(null);
		});
		cyto.on("tap", (evt) => {
			if (evt.target === cyto) {
				cyto.$(":selected").unselect();
				setIsDetailsVisible(false);
				setSelectedNode(null);
				setShowContextMenu(false);
				setContextTarget(null);
			}
		});

		cytoRef.current = cyto;
		nodesRef.current = cyto.nodes();
		setGraphMounted(true);
		return () => {
			if (cyto && !cyto.destroyed()) cyto.destroy();
		};
		// init once
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// UPDATE ELEMENTS (no re-init)
	useEffect(() => {
		const cy = cytoRef.current;
		if (!cy) return;
		const ext = cy.extent?.();
		const cx = ext ? ext.x1 + ext.w / 2 : 0;
		const cyv = ext ? ext.y1 + ext.h / 2 : 0;
		const j = (r = 40) => (Math.random() - 0.5) * r;

		const total = graphData.nodes.length;
		const missingCount = graphData.nodes.filter((n) => n.x == null || n.y == null).length;
		const allMissing = total > 0 && missingCount === total;

		const cyNodes = graphData.nodes.map((n) => {
			const detail = nodeDetails?.[n.id] || {};
			const hasPos = n.x != null && n.y != null;
			// If *all* nodes lack pos (first render), leave undefined so fcose can place them.
			// Otherwise, give new nodes a sensible center+jitter default.
			const pos = hasPos ? { x: n.x, y: n.y } : allMissing ? undefined : { x: cx + j(), y: cyv + j() };
			const hasImage = !!detail.image;
			return {
				data: {
					id: String(n.id),
					label: detail?.name ?? n.label ?? n.name ?? String(n.id),
					type: detail?.type ?? "Default",
					...(hasImage && { image: detail.image, imageOpacity: 1 }),
				},
				...(pos ? { position: pos } : {}),
			};
		});

		const cyEdges = graphData.edges.map((e) => {
			const level = e.level ?? 1;
			const width = level === 2 ? 4 : 2;
			const dashed = level === 0;
			const lineStyle = dashed ? "dashed" : "solid";
			const direction = e.direction ?? "normal";
			const sourceArrow = e.sourceArrow ?? (direction === "reverse" || direction === "both" ? "triangle" : "none");
			const targetArrow = e.targetArrow ?? (direction === "normal" || direction === "both" ? "triangle" : "none");
			return {
				data: {
					id: String(e.id ?? `${e.from}-${e.to}`),
					source: String(e.source ?? e.from),
					target: String(e.target ?? e.to),
					label: e.label ?? "",
					level,
					width,
					dashed,
					lineStyle,
					direction,
					sourceArrow,
					targetArrow,
				},
			};
		});

		// Bulk sync: avoid firing 'add' cola on every element
		cy.scratch("_suppressAddLayout", true);
		const prevIds = new Set(cy.nodes().map((n) => n.id()));
		cy.batch(() => {
			cy.elements().remove();
			cy.add([...cyNodes, ...cyEdges]);
		});
		cy.scratch("_suppressAddLayout", false);

		// If we just introduced some nodes without saved x/y (i.e., *new* ones),
		// run a small local cola to separate them from neighbors.
		if (!allMissing) {
			const added = cy.nodes().filter((nd) => !prevIds.has(nd.id()));
			if (added && !added.empty?.() && added.nonempty?.() ? added.nonempty() : added.length) {
				pushNeighbors(cy, added);
			}
		}
	}, [graphData, nodeDetails]);

	// UPDATE STYLE when settings/theme change
	useEffect(() => {
		const cy = cytoRef.current;
		if (!cy) return;
		cy.style().fromJson(styleJson).update();
	}, [styleJson]);
}
