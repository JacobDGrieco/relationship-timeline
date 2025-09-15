import React, { useState, useEffect, useMemo, useRef } from 'react';
import SidePanel from './SidePanel.jsx';
import ProjectName from './ProjectName.jsx';
import NodeFieldTypes from './NodeFieldTypes.jsx';
import NodeConnectionTypesPopup from './NodeConnectionTypesPopup.jsx';
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
  NODE_CSS: 'node-css',
  CONNECTION_CSS: 'connection-css',
  CHANGELOG: 'changelog',
};

export default function ProjectSettings({
  settings,
  setSettings,
  networkRef,
  nodeDetails,
  setNodeDetails,
  nodeTypes,
  setNodeTypes,
  connectionTypes,
  setConnectionTypes,
  onNodeTypesDeleted,
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
    { key: PANEL.TYPES, title: 'Node/Connection Types', subtitle: 'Define types (soon)' },
    { key: PANEL.CSS, title: 'Custom Node/Connection CSS', subtitle: 'Per-type styles (soon)' },
    { key: PANEL.CHANGELOG, title: 'Project Changelog', subtitle: 'Log & view changes (soon)' },
    { key: PANEL.FIELDS, title: 'Node Field Types', subtitle: 'Manage custom fields' },
    { key: PANEL.STATS, title: "Stats", subtitle: 'Get different stats about the project (no K/D)' }
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
              <NodeConnectionTypesPopup
                networkRef={networkRef}
                nodeDetails={nodeDetails}
                setNodeDetails={setNodeDetails}
                nodeTypes={Array.isArray(nodeTypes) ? nodeTypes : []}
                setNodeTypes={setNodeTypes}
                connectionTypes={Array.isArray(connectionTypes) ? connectionTypes : []}
                setConnectionTypes={setConnectionTypes}
                onNodeTypesDeleted={onNodeTypesDeleted}
                onClose={closeSidePanel}
              />
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

            {activePanel === PANEL.STATS && (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <p style={{ opacity: 0.8, marginTop: 0 }}>Planned: calculate different statistics such as "popularity", distances, etc.</p>
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
  if (key === PANEL.NAME) return 'Project Name';
  if (key === PANEL.FIELDS) return 'Node Field Types';
  if (key === PANEL.TYPES) return 'Node/Connection Types';
  if (key === PANEL.CSS) return 'Custom Node/Connection CSS';
  if (key === PANEL.CHANGELOG) return 'Project Changelog';
  if (key === PANEL.STATS) return 'Stats';
  return 'Settings';
}