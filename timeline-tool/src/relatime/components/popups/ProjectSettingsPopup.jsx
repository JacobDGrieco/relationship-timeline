import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import '../../styles/master-style.css'

const fieldTypes = [
  'description',
  'image-upload',
  'dropdown',
  'static-multiselect',
  'dynamic-multiselect'
];

export default function ProjectSettings({ settings, setSettings, onClose }) {
  const [fields, setFields] = useState(settings || []);

  const addField = () => {
    const newField = {
      id: uuidv4(),
      label: 'New Field',
      type: 'description',
      options: [],
      order: fields.length
    };
    setFields([...fields, newField]);
  };

  const updateField = (id, key, value) => {
    setFields(prev =>
      prev.map(field =>
        field.id === id ? { ...field, [key]: value } : field
      )
    );
  };

  const removeField = (id) => {
    setFields(prev => prev.filter(field => field.id !== id));
  };

  const moveField = (id, direction) => {
    setFields(prev => {
      const index = prev.findIndex(f => f.id === id);
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated.map((f, i) => ({ ...f, order: i }));
    });
  };

  const handleSave = () => {
    setSettings(fields);
    onClose();
  };

  return (
    <div className="popup-overlay">
      <div className="popup" onClick={(e) => e.stopPropagation()} style={{ width: '800px', maxWidth: '90%' }}>
        <h2>Project Settings - Node Fields</h2>
        <ul>
          {fields
            .sort((a, b) => a.order - b.order)
            .map((field, idx) => (
              <li key={idx} className="field-item">
                <input
                  type="text"
                  value={field.label}
                  onChange={e => updateField(field.id, 'label', e.target.value)}
                  placeholder="Field Label"
                />
                <select
                  value={field.type}
                  onChange={e => updateField(field.id, 'type', e.target.value)}
                >
                  {fieldTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                {(field.type === 'dropdown' || field.type.includes('multiselect')) && (
                  <textarea
                    placeholder="Comma-separated options"
                    value={(field.options || []).join(', ')}
                    onChange={e =>
                      updateField(
                        field.id,
                        'options',
                        e.target.value.split(',').map(opt => opt.trim())
                      )
                    }
                  />
                )}

                <button onClick={() => moveField(field.id, 'up')}>↑</button>
                <button onClick={() => moveField(field.id, 'down')}>↓</button>
                <button onClick={() => removeField(field.id)}>Delete</button>
              </li>
            ))}
        </ul>
        <div className="actions">
          <button className="cancel" onClick={onClose}>Cancel</button>
          <button onClick={addField}>Add Field</button>
          <button className="confirm" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};