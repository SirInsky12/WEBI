import React, { useState, useEffect } from 'react';
import { CardRenderer } from './components/CardRenderer.jsx';

export default function Dashboard({ objects = [], states = [], connected = false, showEditor = false, setShowEditor = () => {}, pages = [], currentPageId = 'default', setCurrentPageId = () => {}, setPages = () => {}, dashboard = { views: [] } }) {
  const [searchText, setSearchText] = useState('');
  const [selectingGridFor, setSelectingGridFor] = useState(null);

  // Get current page
  const currentPage = pages.find(p => p.id === currentPageId) || pages[0];

  const updateCurrentPage = (updates) => {
    setPages(prev => prev.map(p => p.id === currentPageId ? { ...p, ...updates } : p));
  };

  const toggleStateSelection = (stateId) => {
    if (!currentPage.states.includes(stateId)) {
      // Wenn hinzufügen, erst Grid auswählen
      setSelectingGridFor(stateId);
    } else {
      // Wenn entfernen, direkt entfernen
      const newStates = currentPage.states.filter(id => id !== stateId);
      const newGridPositions = { ...(currentPage.gridPositions || {}) };
      delete newGridPositions[stateId];
      updateCurrentPage({ states: newStates, gridPositions: newGridPositions });
    }
  };

  const addStateToGrid = (stateId, gridNumber) => {
    const newStates = [...currentPage.states, stateId];
    const newGridPositions = { ...(currentPage.gridPositions || {}), [stateId]: gridNumber };
    updateCurrentPage({ states: newStates, gridPositions: newGridPositions });
    setSelectingGridFor(null);
  };

  const updateEditedName = (stateId, name) => {
    const newEditedNames = { ...currentPage.editedNames, [stateId]: name };
    updateCurrentPage({ editedNames: newEditedNames });
  };

  const selectedStates = states.filter(s => currentPage.states.includes(s.id));
  const gridPositions = currentPage.gridPositions || {};

  // Get cards from the corresponding view for the current page
  // Match view by page name or use index-based mapping
  const currentViewIndex = Math.min(
    dashboard.views.findIndex(v => v.id === currentPageId) >= 0 
      ? dashboard.views.findIndex(v => v.id === currentPageId)
      : pages.findIndex(p => p.id === currentPageId),
    dashboard.views.length - 1
  );
  const currentView = currentViewIndex >= 0 ? dashboard.views?.[currentViewIndex] : dashboard.views?.[0];
  const cards = currentView?.cards || [];

  // Create entity state map for cards to access live state values
  const stateMap = {};
  states.forEach(s => {
    stateMap[s.id] = s.value;
  });

  return (
    <div style={{ padding: '20px' }}>
      {/* Show dashboard cards if they exist */}
      {cards.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {cards.map(card => {
              // Build entities object from card config
              const entitiesObj = {};
              if (card.config?.entities) {
                const entities = Array.isArray(card.config.entities) 
                  ? card.config.entities 
                  : [card.config.entities];
                
                entities.forEach(entityId => {
                  const actualId = typeof entityId === 'string' ? entityId : entityId?.entity_id || entityId;
                  const state = states.find(s => s.id === actualId);
                  if (state) {
                    entitiesObj[actualId] = {
                      state: state.value,
                      attributes: {
                        friendly_name: state.name || actualId,
                        unit_of_measurement: state.rawObject?.common?.unit || '',
                        icon: state.rawObject?.common?.icon || 'mdi:information'
                      }
                    };
                  }
                });
              }

              // Determine container background based on theme
              const theme = card.config?.theme || 'default';
              let containerBg = '#fff';
              if (theme === 'dark') containerBg = '#2d2d2d';
              if (theme === 'light') containerBg = '#f5f5f5';

              return (
                <div key={card.id} style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: 8, 
                  padding: 16,
                  background: containerBg,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <CardRenderer card={card} entities={entitiesObj} states={stateMap} />
                </div>
              );
            })}
        </div>
      ) : (
        /* Fallback to old grid view if no cards */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, width: '100%' }}>
          {/* Grid Dialog for selecting which grid */}
          {selectingGridFor && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000
            }}>
              <div style={{
                background: '#fff',
                padding: 24,
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                  In welchem Grid soll diese Karte angezeigt werden?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {[1, 2, 3, 4].map(gridNum => (
                    <button
                      key={gridNum}
                      onClick={() => addStateToGrid(selectingGridFor, gridNum)}
                      style={{
                        padding: '12px 16px',
                        background: '#0b5cff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 14
                      }}
                    >
                      Grid {gridNum}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSelectingGridFor(null)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: '#ddd',
                    color: '#333',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    marginTop: 12,
                    fontWeight: 600
                  }}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {/* Grid 1 */}
          <div style={{
            border: '2px solid #0b5cff',
            borderRadius: 8,
            padding: 16,
            background: '#f9f9f9',
            minHeight: 400
          }}>
            {showEditor && <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#0b5cff' }}>Grid 1</div>}
            {selectedStates.filter(s => gridPositions[s.id] === 1).length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>Keine States</div>
            ) : (
              selectedStates.filter(s => gridPositions[s.id] === 1).map(s => (
                <div key={s.id} style={{
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  padding: 12,
                  background: '#fff',
                  marginBottom: 12
                }}>
                  {showEditor ? (
                    <input
                      type="text"
                      value={currentPage.editedNames?.[s.id] ?? (s.name || s.id)}
                      onChange={(e) => updateEditedName(s.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px',
                        marginBottom: 8,
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 600,
                        boxSizing: 'border-box'
                      }}
                    />
                  ) : (
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                      {currentPage.editedNames?.[s.id] ?? (s.name || s.id)}
                    </div>
                  )}
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0b5cff' }}>
                    {typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value)} {s.rawObject?.common?.unit || ''}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Grid 2 */}
          <div style={{
            border: '2px solid #0b5cff',
            borderRadius: 8,
            padding: 16,
            background: '#f9f9f9',
            minHeight: 400
          }}>
            {showEditor && <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#0b5cff' }}>Grid 2</div>}
            {selectedStates.filter(s => gridPositions[s.id] === 2).length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>Keine States</div>
            ) : (
              selectedStates.filter(s => gridPositions[s.id] === 2).map(s => (
                <div key={s.id} style={{
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  padding: 12,
                  background: '#fff',
                  marginBottom: 12
                }}>
                  {showEditor ? (
                    <input
                      type="text"
                      value={currentPage.editedNames?.[s.id] ?? (s.name || s.id)}
                      onChange={(e) => updateEditedName(s.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px',
                        marginBottom: 8,
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 600,
                        boxSizing: 'border-box'
                      }}
                    />
                  ) : (
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                      {currentPage.editedNames?.[s.id] ?? (s.name || s.id)}
                    </div>
                  )}
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0b5cff' }}>
                    {typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value)} {s.rawObject?.common?.unit || ''}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Grid 3 */}
          <div style={{
            border: '2px solid #0b5cff',
            borderRadius: 8,
            padding: 16,
            background: '#f9f9f9',
            minHeight: 400
          }}>
            {showEditor && <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#0b5cff' }}>Grid 3</div>}
            {selectedStates.filter(s => gridPositions[s.id] === 3).length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>Keine States</div>
            ) : (
              selectedStates.filter(s => gridPositions[s.id] === 3).map(s => (
                <div key={s.id} style={{
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  padding: 12,
                  background: '#fff',
                  marginBottom: 12
                }}>
                  {showEditor ? (
                    <input
                      type="text"
                      value={currentPage.editedNames?.[s.id] ?? (s.name || s.id)}
                      onChange={(e) => updateEditedName(s.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px',
                        marginBottom: 8,
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 600,
                        boxSizing: 'border-box'
                      }}
                    />
                  ) : (
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                      {currentPage.editedNames?.[s.id] ?? (s.name || s.id)}
                    </div>
                  )}
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0b5cff' }}>
                    {typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value)} {s.rawObject?.common?.unit || ''}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Grid 4 */}
          <div style={{
            border: '2px solid #0b5cff',
            borderRadius: 8,
            padding: 16,
            background: '#f9f9f9',
            minHeight: 400
          }}>
            {showEditor && <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#0b5cff' }}>Grid 4</div>}
            {selectedStates.filter(s => gridPositions[s.id] === 4).length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>Keine States</div>
            ) : (
              selectedStates.filter(s => gridPositions[s.id] === 4).map(s => (
                <div key={s.id} style={{
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  padding: 12,
                  background: '#fff',
                  marginBottom: 12
                }}>
                  {showEditor ? (
                    <input
                      type="text"
                      value={currentPage.editedNames?.[s.id] ?? (s.name || s.id)}
                      onChange={(e) => updateEditedName(s.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px',
                        marginBottom: 8,
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 600,
                        boxSizing: 'border-box'
                      }}
                    />
                  ) : (
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                      {currentPage.editedNames?.[s.id] ?? (s.name || s.id)}
                    </div>
                  )}
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0b5cff' }}>
                    {typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value)} {s.rawObject?.common?.unit || ''}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* State Selector - spanning all 4 columns */}
          {showEditor && (
            <div style={{ gridColumn: 'span 4' }}>
              <div style={{
                background: '#fff',
                border: '2px solid #0b5cff',
                borderRadius: 8,
                padding: 16,
                marginTop: 12
              }}>
                <input
                  type="text"
                  placeholder="States durchsuchen..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: 12,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  Verfügbare States ({states.filter(s => s.id.toLowerCase().includes(searchText.toLowerCase())).length}):
                </div>
                {states.filter(s => s.id.toLowerCase().includes(searchText.toLowerCase())).length === 0 ? (
                  <div style={{ color: '#999', fontSize: 12 }}>Keine States gefunden</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f7f7f7', borderBottom: '1px solid #ddd' }}>
                        <th style={{ textAlign: 'center', padding: '6px', width: '5%' }}></th>
                        <th style={{ textAlign: 'left', padding: '6px', borderRight: '1px solid #eee' }}>ID</th>
                        <th style={{ textAlign: 'left', padding: '6px', borderRight: '1px solid #eee' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '6px', borderRight: '1px solid #eee' }}>Wert</th>
                        <th style={{ textAlign: 'left', padding: '6px' }}>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {states.filter(s => s.id.toLowerCase().includes(searchText.toLowerCase())).map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f0f0f0', background: currentPage.states.includes(s.id) ? '#e3f2fd' : '#fff' }}>
                          <td style={{ textAlign: 'center', padding: '6px' }}>
                            <input
                              type="checkbox"
                              checked={currentPage.states.includes(s.id)}
                              onChange={() => toggleStateSelection(s.id)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '6px', fontSize: 12, borderRight: '1px solid #eee' }}>{s.id}</td>
                          <td style={{ padding: '6px', fontSize: 12, borderRight: '1px solid #eee' }}>{s.name || '-'}</td>
                          <td style={{ padding: '6px', fontSize: 12, fontWeight: 600, borderRight: '1px solid #eee' }}>
                            {(typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value)).slice(0, 30)}
                          </td>
                          <td style={{ padding: '6px', fontSize: 12 }}>{(s.rawObject?.common?.unit) || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
