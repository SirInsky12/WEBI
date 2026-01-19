import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css'
import Dashboard from './Dashboard.jsx'
import DashboardEditor from './DashboardEditor.jsx'
import { mockEntities, createSampleDashboard, exportDashboardToJSON, exportDashboardToYAML } from './mockData.js'
import { validateCard } from './models/dashboard.js'

export default function App() {
  const [socket, setSocket] = useState(null);
  const [objects, setObjects] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [route, setRoute] = useState('dashboard');
  const [showEditor, setShowEditor] = useState(false);
  const [newDashboard, setNewDashboard] = useState(() => {
    const saved = localStorage.getItem('dashboardData');
    const dashboard = saved ? JSON.parse(saved) : createSampleDashboard();
    // Ensure views array exists
    if (!dashboard.views) {
      dashboard.views = [];
    }
    return dashboard;
  });
  const [useMockData, setUseMockData] = useState(false);
  const [pages, setPages] = useState(() => {
    const saved = localStorage.getItem('dashboardPages');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: 'Dashboard', states: [], editedNames: {} }];
  });
  const [currentPageId, setCurrentPageId] = useState(() => {
    const saved = localStorage.getItem('dashboardCurrentPage');
    return saved ? saved : 'default';
  });
  const [addingNewPage, setAddingNewPage] = useState(false);
  const [newPageName, setNewPageName] = useState('');

  useEffect(() => {
    // Verbindung zu ioBroker mit Authentifizierung
    const newSocket = io('http://192.168.1.235:8082', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      path: '/socket.io/',
      transports: ['polling'],
      auth: {
        user: 'Admin',
        pass: 'Mamamia2982012!'
      }
    });

    newSocket.on('connect', () => {
      console.log('Mit ioBroker verbunden');
      setConnected(true);
      setError('');
      
      // Subscribe to state changes
      newSocket.emit('subscribe', 'stateChange');
      
      // Load objects and states automatically
      setTimeout(() => {
        setLoading(true);
      }, 100);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Von ioBroker getrennt:', reason);
      setConnected(false);
      setError(`Getrennt: ${reason}`);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Verbindungsfehler:', err);
      setError(`Verbindungsfehler: ${err.message}`);
    });

    newSocket.on('error', (err) => {
      console.error('Socket Error:', err);
      setError(`Fehler: ${err}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Debug: capture-phase listener to detect which element receives clicks
  useEffect(() => {
    const handler = (e) => {
      try {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        console.log('DEBUG capture mousedown:', { type: e.type, clientX: e.clientX, clientY: e.clientY, target: e.target && (e.target.tagName || e.target.nodeName) });
        if (el) {
          const style = window.getComputedStyle(el);
          console.log('DEBUG elementFromPoint:', el.tagName, 'id=', el.id, 'class=', el.className, 'pointerEvents=', style.pointerEvents, 'zIndex=', style.zIndex);
        }
      } catch (err) {
        console.warn('DEBUG listener error', err);
      }
    };

    document.addEventListener('mousedown', handler, true);
    document.addEventListener('click', handler, true);

    return () => {
      document.removeEventListener('mousedown', handler, true);
      document.removeEventListener('click', handler, true);
    };
  }, []);

  // Save pages to localStorage
  useEffect(() => {
    localStorage.setItem('dashboardPages', JSON.stringify(pages));
  }, [pages]);

  // Save current page to localStorage
  useEffect(() => {
    localStorage.setItem('dashboardCurrentPage', currentPageId);
  }, [currentPageId]);

  // Save dashboard to localStorage
  useEffect(() => {
    localStorage.setItem('dashboardData', JSON.stringify(newDashboard));
  }, [newDashboard]);

  const addNewPage = () => {
    if (!newPageName.trim()) return;
    const newPage = {
      id: 'page-' + Date.now(),
      name: newPageName,
      states: [],
      editedNames: {}
    };
    setPages(prev => [...prev, newPage]);
    setCurrentPageId(newPage.id);
    setNewPageName('');
    setAddingNewPage(false);
  };

  const deletePage = (pageId) => {
    if (pages.length === 1) return;
    const filtered = pages.filter(p => p.id !== pageId);
    setPages(filtered);
    if (currentPageId === pageId) {
      setCurrentPageId(filtered[0].id);
    }
  };
  useEffect(() => {
    if (socket && connected) {
      fetchObjects();
    }
  }, [socket, connected, loading]);

  // Listen for state changes from ioBroker - with polling fallback
  useEffect(() => {
    if (!socket || !connected) {
      return;
    }

    const handleStateChange = (id, state) => {
      setStates(prevStates => 
        prevStates.map(s => 
          s.id === id ? { ...s, value: state?.val, rawState: state } : s
        )
      );
    };

    socket.on('stateChange', handleStateChange);

    // Polling - fetch states every 2 seconds
    const pollInterval = setInterval(() => {
      socket.emit('getStates', (err, statesObj) => {
        if (err) {
          console.error('Error fetching states:', err);
          return;
        }
        
        if (!statesObj) return;

        setStates(prevStates => 
          prevStates.map(s => {
            const updatedState = statesObj[s.id];
            if (updatedState && updatedState.val !== s.value) {
              return { ...s, value: updatedState.val, rawState: updatedState };
            }
            return s;
          })
        );
      });
    }, 2000);

    return () => {
      socket.off('stateChange', handleStateChange);
      clearInterval(pollInterval);
    };
  }, [socket, connected]);

  const fetchObjects = async () => {
    if (!socket) return;

    setLoading(true);
    setError('');

    const getObjectsPromise = () => new Promise((resolve, reject) => {
      try {
        socket.emit('getObjects', (err, objects) => {
          if (err) return reject(err);
          resolve(objects || {});
        });
      } catch (e) { reject(e); }
    });

    const getStatesPromise = () => new Promise((resolve, reject) => {
      try {
        socket.emit('getStates', (err, states) => {
          if (err) return reject(err);
          resolve(states || {});
        });
      } catch (e) { reject(e); }
    });

    try {
      const [objectsObj, statesObj] = await Promise.all([getObjectsPromise(), getStatesPromise()]);

      // Transform objects to array
      const objectList = Object.entries(objectsObj).map(([id, obj]) => ({ id, ...obj }));
      setObjects(objectList);

      // Build states list with id, name, type and value
      const formatName = (n) => {
        if (!n && n !== 0) return '';
        if (typeof n === 'string') return n;
        if (typeof n === 'number' || typeof n === 'boolean') return String(n);
        if (typeof n === 'object') {
          // localized name object like {en: '...', de: '...'}
          if (n.en) return n.en;
          if (n.de) return n.de;
          const vals = Object.values(n).filter(v => typeof v === 'string' && v.trim() !== '');
          if (vals.length) return vals[0];
          try { return JSON.stringify(n); } catch (e) { return String(n); }
        }
        return String(n);
      };

      const statesList = Object.entries(statesObj).map(([id, st]) => {
        const obj = objectsObj[id];
        const rawName = obj?.common?.name ?? obj?.native?.name ?? '';
        const name = formatName(rawName);
        const type = (obj && obj.common && obj.common.type) || (st && typeof st.val !== 'undefined' ? typeof st.val : '');
        return {
          id,
          name,
          type,
          value: st && st.val,
          rawState: st,
          rawObject: obj
        };
      });
      setStates(statesList);
      setError('');
    } catch (err) {
      setError(`Fehler beim Abrufen: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleGroupExpand = (group) => {
    setExpandedGroup(expandedGroup === group ? null : group);
  };

  const groupByAdapter = (objectList) => {
    const grouped = {};
    objectList.forEach(obj => {
      const parts = obj.id.split('.');
      const adapterName = parts[0];
      if (!grouped[adapterName]) {
        grouped[adapterName] = [];
      }
      grouped[adapterName].push(obj);
    });
    return grouped;
  };

  // Build nested tree up to depth 3 (levels: 1,2,3)
  // Group by prefix (everything before the numeric instance) and instance number
  const buildByInstance = (list) => {
    // result: { prefix: { instance: [ items ] } }
    const res = {};
    list.forEach(item => {
      const parts = item.id.split('.');
      // find first numeric part
      const idx = parts.findIndex(p => /^\d+$/.test(p));
      if (idx === -1) {
        // no numeric part: treat full id as prefix with instance '_' (no-instance)
        const prefix = parts.join('.');
        res[prefix] = res[prefix] || {};
        res[prefix]['_'] = res[prefix]['_'] || [];
        res[prefix]['_'].push({ ...item, suffix: '' });
      } else {
        const prefix = parts.slice(0, idx).join('.');
        const instance = parts[idx];
        const suffix = parts.slice(idx + 1).join('.');
        res[prefix] = res[prefix] || {};
        res[prefix][instance] = res[prefix][instance] || [];
        res[prefix][instance].push({ ...item, suffix });
      }
    });
    return res;
  };

  const groupedObjects = buildByInstance(objects);

  const togglePath = (path) => {
    setExpandedPaths(prev => {
      const set = new Set(prev);
      if (set.has(path)) set.delete(path);
      else set.add(path);
      return Array.from(set);
    });
  };

  const isExpanded = (path) => expandedPaths.includes(path);

  // Group states similarly for grouped table
  const groupedStates = buildByInstance(states.map(s => ({ id: s.id, ...s })));

  const hasDashboardPage = pages.some(p => (p.name || '').toLowerCase() === 'dashboard');

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '0', margin: '0', background: '#f8f9fa', minHeight: '100vh' }}>
      <nav style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        display: 'flex', 
        gap: 16, 
        padding: '14px 24px', 
        background: 'linear-gradient(135deg, #0b5cff 0%, #0a4fd1 100%)', 
        color: 'white', 
        alignItems: 'center', 
        zIndex: 1000, 
        boxShadow: '0 4px 12px rgba(11,92,255,0.3)'
      }}>
        <div style={{ 
          fontWeight: 700, 
          marginRight: 24,
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <span style={{ fontSize: 24 }}>🏠</span>
          <span>ioBroker Dashboard</span>
        </div>
        
        {/* Route Navigation */}
        <div style={{ display: 'flex', gap: 10 }}>
          {!hasDashboardPage && (
            <button
              onClick={() => setRoute('dashboard')}
              style={{
                background: route === 'dashboard' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                color: 'white',
                border: route === 'dashboard' ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
                padding: '10px 18px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: route === 'dashboard' ? 700 : 500,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: route === 'dashboard' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (route !== 'dashboard') {
                  e.target.style.background = 'rgba(255,255,255,0.2)';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (route !== 'dashboard') {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              <span style={{ fontSize: 16 }}>📊</span>
              <span>Dashboard</span>
            </button>
          )}
          <button
            onClick={() => setRoute('editor')}
            style={{
              background: route === 'editor' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: route === 'editor' ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
              padding: '10px 18px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: route === 'editor' ? 700 : 500,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: route === 'editor' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (route !== 'editor') {
                e.target.style.background = 'rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (route !== 'editor') {
                e.target.style.background = 'rgba(255,255,255,0.1)';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            <span style={{ fontSize: 16 }}>✏️</span>
            <span>Editor</span>
          </button>
          <button
            onClick={() => setRoute('validation')}
            style={{
              background: route === 'validation' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: route === 'validation' ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
              padding: '10px 18px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: route === 'validation' ? 700 : 500,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: route === 'validation' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (route !== 'validation') {
                e.target.style.background = 'rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (route !== 'validation') {
                e.target.style.background = 'rgba(255,255,255,0.1)';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            <span style={{ fontSize: 16 }}>✅</span>
            <span>Validierung</span>
          </button>
        </div>
        
        {/* Page navigation */}
        {route === 'dashboard' && (
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            alignItems: 'center', 
            marginLeft: 16, 
            flexWrap: 'wrap',
            paddingLeft: 16,
            borderLeft: '2px solid rgba(255,255,255,0.3)'
          }}>
            {pages.map(page => (
              <div key={page.id} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPageId(page.id)}
                  style={{
                    background: currentPageId === page.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: currentPageId === page.id ? '2px solid rgba(255,255,255,0.6)' : '2px solid transparent',
                    padding: '8px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: currentPageId === page.id ? 700 : 500,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  onMouseEnter={(e) => {
                    if (currentPageId !== page.id) {
                      e.target.style.background = 'rgba(255,255,255,0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPageId !== page.id) {
                      e.target.style.background = 'rgba(255,255,255,0.1)';
                    }
                  }}
                >
                  <span style={{ fontSize: 16 }}>📄</span>
                  <span>{page.name}</span>
                </button>
                {showEditor && pages.length > 1 && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Seite "${page.name}" wirklich löschen?`)) {
                        deletePage(page.id);
                      }
                    }}
                    title="Seite löschen"
                    style={{
                      background: 'rgba(220,53,69,0.2)',
                      color: 'white',
                      border: '1px solid rgba(220,53,69,0.4)',
                      padding: '6px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      transition: 'all 0.2s',
                      fontWeight: 600
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(220,53,69,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(220,53,69,0.2)';
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
            
            {showEditor && (
              <>
                {!addingNewPage ? (
                  <button
                    onClick={() => setAddingNewPage(true)}
                    title="Neue Seite hinzufügen"
                    style={{
                      background: 'rgba(40,167,69,0.3)',
                      color: 'white',
                      border: '2px solid rgba(40,167,69,0.5)',
                      padding: '8px 14px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 18,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(40,167,69,0.4)';
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(40,167,69,0.3)';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    <span>➕</span>
                    <span style={{ fontSize: 12 }}>Seite</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(255,255,255,0.15)', padding: '6px 8px', borderRadius: 8 }}>
                    <input
                      type="text"
                      placeholder="Seitenname..."
                      value={newPageName}
                      onChange={(e) => setNewPageName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') addNewPage();
                        if (e.key === 'Escape') { setAddingNewPage(false); setNewPageName(''); }
                      }}
                      autoFocus
                      style={{
                        padding: '6px 10px',
                        border: '2px solid rgba(255,255,255,0.5)',
                        borderRadius: 6,
                        fontSize: 13,
                        width: 140,
                        background: 'rgba(255,255,255,0.95)',
                        color: '#333',
                        fontWeight: 500,
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={addNewPage}
                      disabled={!newPageName.trim()}
                      title="Seite hinzufügen"
                      style={{
                        background: newPageName.trim() ? 'rgba(40,167,69,0.9)' : 'rgba(108,117,125,0.5)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: 6,
                        cursor: newPageName.trim() ? 'pointer' : 'not-allowed',
                        fontSize: 14,
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => { setAddingNewPage(false); setNewPageName(''); }}
                      title="Abbrechen"
                      style={{
                        background: 'rgba(108,117,125,0.7)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        <div style={{ 
          marginLeft: 'auto', 
          display: 'flex', 
          gap: 16, 
          alignItems: 'center'
        }}>
          {/* Connection Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.15)',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600
          }}>
            <div style={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              background: connected ? '#28a745' : '#dc3545',
              boxShadow: connected ? '0 0 8px rgba(40,167,69,0.8)' : '0 0 8px rgba(220,53,69,0.8)',
              animation: connected ? 'pulse 2s infinite' : 'none'
            }}></div>
            <span>{connected ? 'Verbunden' : 'Getrennt'}</span>
          </div>
        </div>
      </nav>

      <main style={{ padding: 24, maxWidth: 1600, margin: '0 auto', paddingTop: 84 }}>
        {route === 'dashboard' ? (
          <Dashboard 
            objects={objects} 
            states={states} 
            connected={connected} 
            showEditor={showEditor} 
            setShowEditor={setShowEditor}
            pages={pages}
            currentPageId={currentPageId}
            setCurrentPageId={setCurrentPageId}
            setPages={setPages}
            dashboard={newDashboard}
          />
        ) : route === 'editor' ? (
          <DashboardEditor
            dashboard={newDashboard}
            entities={states.length > 0 ? states : mockEntities}
            onDashboardChange={setNewDashboard}
            title="Dashboard Editor"
          />
        ) : route === 'validation' ? (
          <ValidationDemo dashboard={newDashboard} mockEntities={mockEntities} />
        ) : null}
      </main>
    </div>
  );
}

/**
 * ValidationDemo - Demonstrates data model validation and import/export
 */
function ValidationDemo({ dashboard = {}, mockEntities = {} }) {
  const [exportFormat, setExportFormat] = useState('json');

  const allCards = dashboard.views?.flatMap(v => v.cards) || [];
  const validationResults = allCards.map(card => ({
    id: card.id,
    type: card.type,
    title: card.config?.title || '(untitled)',
    validation: validateCard(card)
  }));

  const hasErrors = validationResults.some(r => !r.validation.valid);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Validation Results */}
      <div>
        <h2>📋 Validation Results</h2>
        <div style={{ 
          padding: 12, 
          background: hasErrors ? '#fff3cd' : '#d4edda',
          border: `1px solid ${hasErrors ? '#ffc107' : '#28a745'}`,
          borderRadius: 6,
          marginBottom: 16,
          color: hasErrors ? '#856404' : '#155724'
        }}>
          {hasErrors ? (
            <strong>⚠️ {validationResults.filter(r => !r.validation.valid).length} card(s) have validation errors</strong>
          ) : (
            <strong>✓ All {allCards.length} cards are valid!</strong>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {validationResults.map(result => (
            <div key={result.id} style={{
              padding: 12,
              border: result.validation.valid ? '1px solid #ddd' : '2px solid #dc3545',
              borderRadius: 6,
              background: result.validation.valid ? '#fff' : '#fff5f5'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>
                  {result.validation.valid ? '✓' : '✕'}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{result.title}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>
                    Type: {result.type} | ID: {result.id}
                  </div>
                </div>
              </div>
              {!result.validation.valid && (
                <div style={{ fontSize: 11, color: '#dc3545', paddingLeft: 24 }}>
                  {result.validation.errors.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Export & Statistics */}
      <div>
        <h2>📦 Export & Statistics</h2>

        <div style={{ 
          padding: 12, 
          background: '#f9f9f9',
          border: '1px solid #ddd',
          borderRadius: 6,
          marginBottom: 16
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Statistics</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
            <div>
              <div style={{ color: '#666' }}>Views</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#0b5cff' }}>
                {dashboard.views?.length || 0}
              </div>
            </div>
            <div>
              <div style={{ color: '#666' }}>Cards</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#0b5cff' }}>
                {allCards.length}
              </div>
            </div>
            <div>
              <div style={{ color: '#666' }}>Valid Cards</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#28a745' }}>
                {validationResults.filter(r => r.validation.valid).length}
              </div>
            </div>
            <div>
              <div style={{ color: '#666' }}>Invalid Cards</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#dc3545' }}>
                {validationResults.filter(r => !r.validation.valid).length}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Export Format
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setExportFormat('json')}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: exportFormat === 'json' ? '#0b5cff' : '#ddd',
                color: exportFormat === 'json' ? 'white' : '#333',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              JSON
            </button>
            <button
              onClick={() => setExportFormat('yaml')}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: exportFormat === 'yaml' ? '#0b5cff' : '#ddd',
                color: exportFormat === 'yaml' ? 'white' : '#333',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              YAML
            </button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Exported Data</div>
          <textarea
            value={exportFormat === 'json' 
              ? exportDashboardToJSON(dashboard)
              : exportDashboardToYAML(dashboard)
            }
            readOnly
            style={{
              width: '100%',
              minHeight: 300,
              padding: 12,
              fontSize: 11,
              fontFamily: 'monospace',
              border: '1px solid #ddd',
              borderRadius: 4,
              boxSizing: 'border-box'
            }}
          />
          <button
            onClick={() => {
              const text = exportFormat === 'json' 
                ? exportDashboardToJSON(dashboard)
                : exportDashboardToYAML(dashboard);
              navigator.clipboard.writeText(text);
              alert('Copied to clipboard!');
            }}
            style={{
              marginTop: 8,
              padding: '8px 16px',
              background: '#0b5cff',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600
            }}
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
}
