import React, { useMemo, useState, useEffect } from "react";

const EMPTY_RULE = () => ({
	id: crypto.randomUUID(),
	match: { mode: "type", type: "" },
	style: { color: "", shape: "", size: "", imageOpacity: "" },
});

export default function NodeConnectionCSSPopup({
	projectSettings, // full project settings object
	setProjectSettings, // setter that updates project settings
	availableFieldNames = [],
	onClose,
}) {
	const initial = useMemo(() => {
		const nc = projectSettings?.nodeStyles;
		return {
			defaultStyle: {
				color: nc?.defaultStyle?.color ?? "#888888",
				shape: nc?.defaultStyle?.shape ?? "dot",
				size: nc?.defaultStyle?.size ?? 30,
				imageOpacity: nc?.defaultStyle?.imageOpacity ?? 1,
			},
			rules: Array.isArray(nc?.rules) ? nc.rules : [],
		};
	}, [projectSettings]);

	const [working, setWorking] = useState(initial);
	useEffect(() => {
		setWorking(initial);
	}, [initial]);

	const handleSave = () => {
		setProjectSettings((prev) => {
			const next = { ...(prev || {}) };
			next.nodeStyles = {
				defaultStyle: {
					color: working.defaultStyle.color || "#888888",
					shape: working.defaultStyle.shape || "dot",
					size: Number(working.defaultStyle.size) || 30,
					imageOpacity: clamp01(Number(working.defaultStyle.imageOpacity)),
				},
				rules: working.rules,
			};
			return next;
		});
		onClose();
	};

	return (
		<>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "0.5rem",
					marginBottom: "1rem",
				}}
			>
				<h2 id="sidepanel-title" style={{ margin: 0 }}>
					Node / Connection Styles
				</h2>
			</div>
			<div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
				<div>
					<h3 style={{ margin: 0 }}>Node Styles</h3>
					<fieldset style={{ marginTop: ".5rem" }}>
						<legend>Default Style</legend>
						<label
							style={{
								display: "grid",
								gridTemplateColumns: "140px 1fr",
								alignItems: "center",
								gap: ".5rem",
							}}
						>
							<span style={{ opacity: 0.8 }}>Color</span>
							<input
								type="color"
								value={working.defaultStyle.color}
								onChange={(e) =>
									setWorking((w) => ({
										...w,
										defaultStyle: { ...w.defaultStyle, color: e.target.value },
									}))
								}
							/>
						</label>
						<label
							style={{
								display: "grid",
								gridTemplateColumns: "140px 1fr",
								alignItems: "center",
								gap: ".5rem",
							}}
						>
							<span style={{ opacity: 0.8 }}>Shape</span>
							<select
								value={working.defaultStyle.shape}
								onChange={(e) =>
									setWorking((w) => ({
										...w,
										defaultStyle: { ...w.defaultStyle, shape: e.target.value },
									}))
								}
							>
								<option>dot</option>
								<option>triangle</option>
								<option>triangleDown</option>
								<option>square</option>
								<option>diamond</option>
								<option>hexagon</option>
								<option>star</option>
								<option>ellipse</option>
								<option>box</option>
								<option>database</option>
							</select>
						</label>
						<label
							style={{
								display: "grid",
								gridTemplateColumns: "140px 1fr",
								alignItems: "center",
								gap: ".5rem",
							}}
						>
							<span style={{ opacity: 0.8 }}>Size</span>
							<input
								type="number"
								min={8}
								max={96}
								value={working.defaultStyle.size}
								onChange={(e) => {
									const n = Number(e.target.value || 0);
									const clamped = isNaN(n) ? 30 : Math.max(8, Math.min(96, n));
									setWorking((w) => ({
										...w,
										defaultStyle: { ...w.defaultStyle, size: clamped },
									}));
								}}
							/>
						</label>
						<label
							style={{
								display: "grid",
								gridTemplateColumns: "140px 1fr",
								alignItems: "center",
								gap: ".5rem",
							}}
						>
							<span style={{ opacity: 0.8 }}>Image Opacity</span>
							<div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
								<input
									type="range"
									min={0}
									max={1}
									step={0.05}
									value={working.defaultStyle.imageOpacity}
									onChange={(e) => {
										const v = Number(e.target.value);
										setWorking((w) => ({
											...w,
											defaultStyle: {
												...w.defaultStyle,
												imageOpacity: clamp01(v),
											},
										}));
									}}
									style={{ width: "100%" }}
								/>
								<input
									type="number"
									min={0}
									max={1}
									step={0.05}
									value={working.defaultStyle.imageOpacity}
									onChange={(e) => {
										const v = Number(e.target.value);
										setWorking((w) => ({
											...w,
											defaultStyle: {
												...w.defaultStyle,
												imageOpacity: clamp01(v),
											},
										}));
									}}
									style={{ width: "80px" }}
								/>
							</div>
						</label>
					</fieldset>
				</div>

				{/* Connection CSS
                <div>
                    <h3 style={{ margin: 0 }}>Connection CSS</h3>
                </div> */}
			</div>

			<div className="actions">
				<button className="cancel" onClick={onClose}>
					Back
				</button>
				<button className="confirm" onClick={handleSave}>
					Save
				</button>
			</div>
		</>
	);
}

function clamp01(n) {
	return Math.max(0, Math.min(1, isNaN(n) ? 1 : Number(n)));
}
