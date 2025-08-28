import React, { useState, useEffect, useMemo, useRef } from 'react';
import SidePanel from './SidePanel.jsx';
import ProjectName from './ProjectName.jsx';
import NodeFieldTypes from './NodeFieldTypes.jsx';
import '../../styles/master-style.css';

const fieldTypes = [
  'description',
  'dropdown',
  'static-multiselect',
  'dynamic-multiselect'
];

const PANEL = {
  MENU: 'menu',
  NAME: 'project-name',
  FIELDS: 'node-fields',
  TYPES: 'types',
  CSS: 'custom-css',
  CHANGELOG: 'changelog',
};

export default function ProjectSettings({
  settings,
  setSettings,
  projectName,
  setProjectName,
  onClose,
  onOptionsDeleted
}) {
  const [activePanel, setActivePanel] = useState(PANEL.MENU);
  const [closingSide, setClosingSide] = useState(false);
  const [nestedOpen, setNestedOpen] = useState(false);
  const overlayRef = useRef(null);

  const isSideOpen = activePanel !== PANEL.MENU;

  const cards = useMemo(() => ([
    { key: PANEL.NAME, title: 'Project Name', subtitle: 'Rename your project' },
    { key: PANEL.FIELDS, title: 'Node Field Types', subtitle: 'Manage custom fields' },
    { key: PANEL.TYPES, title: 'Node/Connection Types', subtitle: 'Define types (soon)' },
    { key: PANEL.CSS, title: 'Custom Node/Connection CSS', subtitle: 'Per-type styles (soon)' },
    { key: PANEL.CHANGELOG, title: 'Project Changelog', subtitle: 'Log & view changes (soon)' },
  ]), []);

  const closeSidePanel = () => {
    setClosingSide(true);
    setTimeout(() => {
      setClosingSide(false);
      setActivePanel(PANEL.MENU);
    }, 300);
  };

  const handleOverlayClick = () => {
    if (isSideOpen) {
      closeSidePanel();
    } else {
      onClose();
    }
  };

  return (
    <>
      <div className="popup-overlay" ref={overlayRef} onClick={handleOverlayClick}>
        <div
          className={`popup ${isSideOpen ? (closingSide ? 'slide-right' : 'slide-left') : ''}`}
          onClick={(e) => e.stopPropagation()}
          style={{ width: '860px', maxWidth: '92%' }}
        >
          <h2 style={{ marginBottom: '1rem' }}>Project Settings</h2>

          {activePanel === PANEL.MENU && (
            <>
              <div className="settings-cards">
                {cards.map(card => (
                  <button
                    key={card.key}
                    className="settings-card"
                    onClick={() => setActivePanel(card.key)}
                  >
                    <div className="settings-card-title">{card.title}</div>
                    <div className="settings-card-sub">{card.subtitle}</div>
                  </button>
                ))}
              </div>

              <div className="actions">
                <button className="cancel" onClick={onClose}>Close</button>
              </div>
            </>
          )}
        </div>

        {/* Side panel host */}
        {activePanel !== PANEL.MENU && (
          <SidePanel
            className={`${closingSide ? 'slide-out' : 'slide-in'} ${nestedOpen ? 'nested-open' : ''}`}
            title={panelTitle(activePanel)}
            onClose={closeSidePanel}
          >
            {activePanel === PANEL.NAME && (
              <ProjectName
                projectName={projectName}
                setProjectName={setProjectName}
                onClose={closeSidePanel}
              />
            )}

            {activePanel === PANEL.FIELDS && (
              <NodeFieldTypes
                settings={settings}
                setSettings={setSettings}
                onClose={closeSidePanel}
                overlayNode={overlayRef.current}
                setNestedOpen={setNestedOpen}
                onOptionsDeleted={onOptionsDeleted}
              />
            )}

            {activePanel === PANEL.TYPES && (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <p style={{ opacity: 0.8, marginTop: 0 }}>This feature is coming soon. You’ll be able to define named types for nodes and connections, set defaults, and reference them elsewhere.</p>
                <div className="actions">
                  <button className="cancel" onClick={closeSidePanel}>Back</button>
                </div>
              </div>
            )}

            {activePanel === PANEL.CSS && (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <p style={{ opacity: 0.8, marginTop: 0 }}>Planned: add custom CSS per type (e.g., colors, borders, badges). You’ll preview changes live.</p>
                <div className="actions">
                  <button className="cancel" onClick={closeSidePanel}>Back</button>
                </div>
              </div>
            )}

            {activePanel === PANEL.CHANGELOG && (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <p style={{ opacity: 0.8, marginTop: 0 }}>Planned: automatically record snapshots and edits; view, filter, and restore from the log.</p>
                <div className="actions">
                  <button className="cancel" onClick={closeSidePanel}>Back</button>
                </div>
              </div>
            )}
          </SidePanel>
        )}
      </div >
    </>
  );
}

function panelTitle(key) {
  if (key === 'project-name') return 'Project Name';
  if (key === 'node-fields') return 'Node Field Types';
  if (key === 'types') return 'Node/Connection Types';
  if (key === 'custom-css') return 'Custom Node/Connection CSS';
  if (key === 'changelog') return 'Project Changelog';
  return 'Settings';
}