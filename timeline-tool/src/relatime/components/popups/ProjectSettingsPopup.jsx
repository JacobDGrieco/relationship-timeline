import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DropdownOptionsPopup from './DropdownOptionsPopup.jsx';
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
  const [editingField, setEditingField] = useState(null); // {id,label,type,options}
  const [closingOptions, setClosingOptions] = useState(false);

  useEffect(() => {
    setFields(settings || []);
  }, [settings]);

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

  const closeOptionsPopup = () => {
    setClosingOptions(true);
    setTimeout(() => {
      setClosingOptions(false);
      setEditingField(null);
    }, 300); // match animation duration
  };

  return (
    <div
      className="popup-overlay"
      onClick={() => {
        // Clicking the dim backdrop:
        if (editingField) closeOptionsPopup();  // close side editor first
        else onClose();                           // otherwise close settings
      }}
    >
      <div
        className={`popup ${editingField ? closingOptions ? 'slide-right' : 'slide-left' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '800px', maxWidth: '90%' }}
      >
        <h2>Project Settings - Node Fields</h2>
        <ul>
          {fields
            .slice().sort((a, b) => a.order - b.order)
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
                  onChange={e => {
                    const nextType = e.target.value;
                    updateField(field.id, 'type', nextType);
                    if (nextType === 'dropdown' || nextType.includes('multiselect')) {
                      // ensure options exists
                      if (!Array.isArray(field.options)) {
                        updateField(field.id, 'options', []);
                      }
                    }
                  }}>
                  {fieldTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                {(field.type === 'dropdown' || field.type.includes('multiselect')) && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    <button type="button" onClick={() => setEditingField(field)} style={{whiteSpace: 'nowrap', fontSize: '75%'}}>
                      Edit options
                    </button>
                    <span style={{ opacity: 0.7, fontSize: 12 }}>
                      {Array.isArray(field.options)
                        ? field.options.length === 0
                          ? 'No options'
                          : field.options.length === 1
                            ? '1 option'
                            : `${field.options.length} options`
                        : 'No options'}
                    </span>
                  </div>
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

      {editingField && (
        <DropdownOptionsPopup
          field={editingField}
          className={closingOptions ? 'slide-out' : 'slide-in'}
          onClose={closeOptionsPopup}
          onSave={(nextOptions) => {
            updateField(editingField.id, 'options', nextOptions);
            closeOptionsPopup();
          }}
        />
      )}
    </div >
  );
};