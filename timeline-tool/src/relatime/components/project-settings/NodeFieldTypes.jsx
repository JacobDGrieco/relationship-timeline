// ./NodeFieldTypes.jsx
import React, { useState, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import DropdownOptionsPopup from "./DropdownOptionsPopup.jsx";
import "../../styles/master-style.css";

const fieldTypes = ["description", "dropdown", "static-multiselect", "dynamic-multiselect"];

export default function NodeFieldTypes({ fields: incomingFields, setFields: setNodeFields, onClose, overlayNode, setNestedOpen, onOptionsDeleted }) {
	const [fields, setFields] = useState(incomingFields || []);
	const [editingField, setEditingField] = useState(null); // {id,label,type,options}
	const [closingOptions, setClosingOptions] = useState(false);

	useEffect(() => {
		setFields(incomingFields || []);
	}, [incomingFields]);

	const addField = () => {
		const newField = {
			id: uuidv4(),
			label: "New Field",
			type: "description",
			options: [],
			order: fields.length,
		};
		setFields((prev) => [...prev, newField]);
	};

	const updateField = (id, key, value) => {
		setFields((prev) => prev.map((field) => (field.id === id ? { ...field, [key]: value } : field)));
	};

	const removeField = (id) => {
		setFields((prev) => prev.filter((field) => field.id !== id));
	};

	const moveField = (id, direction) => {
		setFields((prev) => {
			const index = prev.findIndex((f) => f.id === id);
			const newIndex = direction === "up" ? index - 1 : index + 1;
			if (newIndex < 0 || newIndex >= prev.length) return prev;
			const updated = [...prev];
			[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
			return updated.map((f, i) => ({ ...f, order: i }));
		});
	};

	const handleSave = () => {
		const normalized = [...fields].sort((a, b) => a.order - b.order).map((f, i) => ({ ...f, order: i }));
		setNodeFields(normalized);
		onClose();
	};

	const closeSidePanel = () => {
		setNestedOpen?.(false);
		setClosingOptions(true);
		setTimeout(() => {
			setClosingOptions(false);
			setEditingField(null);
		}, 300);
	};

	return (
		<>
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "1rem" }}>
				<h2 id="sidepanel-title" style={{ margin: 0 }}>
					Node Field Types
				</h2>
			</div>
			<div className={`panel-body ${editingField ? "collapsed" : ""}`}>
				<ul>
					{useMemo(() => fields.slice().sort((a, b) => a.order - b.order), [fields]).map((field) => (
						<li key={field.id} className="field-item" style={{ gap: 8 }}>
							<input
								type="text"
								value={field.label}
								onChange={(e) => updateField(field.id, "label", e.target.value)}
								placeholder="Field Label"
							/>
							<select
								value={field.type}
								onChange={(e) => {
									const nextType = e.target.value;
									updateField(field.id, "type", nextType);
									if (nextType === "dropdown" || nextType.includes("multiselect")) {
										if (!Array.isArray(field.options)) {
											updateField(field.id, "options", []);
										}
									}
								}}
							>
								{fieldTypes.map((type) => (
									<option key={type} value={type}>
										{type}
									</option>
								))}
							</select>

							{(field.type === "dropdown" || field.type.includes("multiselect")) && (
								<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
									<button
										type="button"
										onClick={() => {
											setNestedOpen?.(true);
											setEditingField(field);
										}}
										style={{ whiteSpace: "nowrap", fontSize: "75%" }}
									>
										Edit options
									</button>
									<span style={{ opacity: 0.7, fontSize: 12 }}>
										{Array.isArray(field.options)
											? field.options.length === 0
												? "No options"
												: field.options.length === 1
												? "1 option"
												: `${field.options.length} options`
											: "No options"}
									</span>
								</div>
							)}

							<button onClick={() => moveField(field.id, "up")}>↑</button>
							<button onClick={() => moveField(field.id, "down")}>↓</button>
							<button onClick={() => removeField(field.id)}>Delete</button>
						</li>
					))}
				</ul>

				<div className="actions">
					<button className="cancel" onClick={onClose}>
						Back
					</button>
					<button onClick={addField}>Add Field</button>
					<button className="confirm" onClick={handleSave}>
						Save
					</button>
				</div>
			</div>

			{editingField && (
				<DropdownOptionsPopup
					field={editingField}
					overlayNode={overlayNode}
					className={closingOptions ? "slide-out" : "slide-in"}
					onClose={closeSidePanel}
					onSave={(nextOptions) => {
						updateField(editingField.id, "options", nextOptions);
						closeSidePanel();
					}}
					onOptionsDeleted={onOptionsDeleted}
				/>
			)}
		</>
	);
}
