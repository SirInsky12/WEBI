import React, { useState, useEffect, useMemo } from 'react';
import { createCard, CardSchemas } from './models/dashboard.js';
import CardFormGenerator from './components/CardFormGenerator.jsx';
import { CardPreview } from './components/CardRenderer.jsx';

/**
 * DashboardEditor Component
 * Main editor for building and editing dashboard views and cards
 */
export default function DashboardEditor({ 
  dashboard = { views: [] },
  entities = {},
  onDashboardChange = () => {},
  title = 'Dashboard Editor'
}) {
  const [currentViewIdx, setCurrentViewIdx] = useState(0);
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [showAddCardMenu, setShowAddCardMenu] = useState(false);
  const [editingViewTitle, setEditingViewTitle] = useState(false);
  const [newViewTitle, setNewViewTitle] = useState('');
  const [editingCardIdx, setEditingCardIdx] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);

  // Convert entities array to object format if needed
  const entitiesObj = useMemo(() => {
    if (Array.isArray(entities)) {
      // Convert from states array format to entity object format
      return entities.reduce((acc, state) => {
        acc[state.id] = {
          state: state.value,
          attributes: {
            friendly_name: state.name || state.id,
            unit_of_measurement: state.rawObject?.common?.unit || '',
            icon: state.rawObject?.common?.icon || 'mdi:information'
          }
        };
        return acc;
      }, {});
    }
    return entities;
  }, [entities]);

  const currentView = dashboard.views[currentViewIdx];
  const currentCard = selectedCardIdx !== null ? currentView?.cards[selectedCardIdx] : null;

  const updateView = (updates) => {
    const newViews = dashboard.views.map((v, idx) => 
      idx === currentViewIdx ? { ...v, ...updates } : v
    );
    onDashboardChange({ ...dashboard, views: newViews });
  };

  const updateCard = (cardIdx, updates) => {
    if (!currentView) return;
    const newCards = currentView.cards.map((c, idx) =>
      idx === cardIdx ? { ...c, ...updates } : c
    );
    updateView({ cards: newCards });
  };

  const addCard = (cardType) => {
    if (!currentView) return;
    const schema = CardSchemas[cardType];
    const newCard = createCard(
      `card-${cardType}-${Date.now()}`,
      cardType,
      // Initialize with defaults from schema
      Object.entries(schema.fields).reduce((acc, [key, field]) => {
        acc[key] = field.default;
        return acc;
      }, {})
    );
    const newCards = [...currentView.cards, newCard];
    updateView({ cards: newCards });
    setEditingCardIdx(newCards.length - 1);
    setShowAddCardMenu(false);
    setShowCardModal(true);
  };

  const deleteCard = (cardIdx) => {
    if (!currentView) return;
    const newCards = currentView.cards.filter((_, idx) => idx !== cardIdx);
    updateView({ cards: newCards });
    setSelectedCardIdx(null);
  };

  const moveCard = (fromIdx, direction) => {
    if (!currentView) return;
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= currentView.cards.length) return;

    const newCards = [...currentView.cards];
    [newCards[fromIdx], newCards[toIdx]] = [newCards[toIdx], newCards[fromIdx]];
    updateView({ cards: newCards });
    setSelectedCardIdx(toIdx);
  };

  const addView = () => {
    if (!newViewTitle.trim()) return;
    const newViews = [...dashboard.views, {
      id: `view-${Date.now()}`,
      title: newViewTitle,
      cards: []
    }];
    onDashboardChange({ ...dashboard, views: newViews });
    setCurrentViewIdx(newViews.length - 1);
    setNewViewTitle('');
    setEditingViewTitle(false);
  };

  const deleteView = (viewIdx) => {
    if (dashboard.views.length === 1) return;
    const newViews = dashboard.views.filter((_, idx) => idx !== viewIdx);
    onDashboardChange({ ...dashboard, views: newViews });
    setCurrentViewIdx(Math.max(0, viewIdx - 1));
  };

  const renameView = (viewIdx, newTitle) => {
    const newViews = dashboard.views.map((v, idx) =>
      idx === viewIdx ? { ...v, title: newTitle } : v
    );
    onDashboardChange({ ...dashboard, views: newViews });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0, height: 'calc(100vh - 90px)', maxHeight: '100%' }}>
      {/* Left Sidebar - View Navigation */}
      <div style={{ 
        background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)', 
        borderRight: '2px solid #e9ecef',
        padding: 20,
        overflowY: 'auto',
        boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{ 
          fontSize: 14, 
          fontWeight: 700, 
          marginBottom: 16, 
          color: '#0b5cff',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 18 }}>📁</span>
          <span>Ansichten</span>
          <span style={{ 
            marginLeft: 'auto',
            fontSize: 11,
            background: '#e3f2fd',
            color: '#0b5cff',
            padding: '2px 8px',
            borderRadius: 12,
            fontWeight: 600
          }}>
            {dashboard.views.length}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dashboard.views.map((view, idx) => (
            <div
              key={view.id}
              onClick={() => {
                setCurrentViewIdx(idx);
                setSelectedCardIdx(null);
              }}
              style={{
                padding: '12px 14px',
                background: currentViewIdx === idx ? 'linear-gradient(135deg, #0b5cff 0%, #0a4fd1 100%)' : '#fff',
                color: currentViewIdx === idx ? '#fff' : '#333',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: currentViewIdx === idx ? 600 : 500,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: currentViewIdx === idx ? 'none' : '1px solid #e9ecef',
                boxShadow: currentViewIdx === idx ? '0 2px 8px rgba(11,92,255,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
                ':hover': {
                  transform: 'translateX(4px)'
                }
              }}
              onMouseEnter={(e) => {
                if (currentViewIdx !== idx) {
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentViewIdx !== idx) {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <span style={{ fontSize: 14 }}>📄</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {view.title}
                </span>
                <span style={{ 
                  fontSize: 10,
                  background: currentViewIdx === idx ? 'rgba(255,255,255,0.2)' : '#e3f2fd',
                  color: currentViewIdx === idx ? '#fff' : '#0b5cff',
                  padding: '2px 6px',
                  borderRadius: 10,
                  fontWeight: 600
                }}>
                  {view.cards.length}
                </span>
              </div>
              {dashboard.views.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`"${view.title}" wirklich löschen?`)) {
                      deleteView(idx);
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: currentViewIdx === idx ? '#fff' : '#dc3545',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: '4px 6px',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = currentViewIdx === idx ? 'rgba(255,255,255,0.2)' : 'rgba(220,53,69,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                  }}
                  title="Ansicht löschen"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>

        {!editingViewTitle ? (
          <button
            onClick={() => setEditingViewTitle(true)}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '12px 14px',
              background: 'linear-gradient(135deg, #28a745 0%, #218838 100%)',
              border: 'none',
              color: '#fff',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              boxShadow: '0 2px 8px rgba(40,167,69,0.3)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(40,167,69,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(40,167,69,0.3)';
            }}
          >
            <span style={{ fontSize: 16 }}>➕</span>
            <span>Neue Ansicht</span>
          </button>
        ) : (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              value={newViewTitle}
              onChange={(e) => setNewViewTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') addView();
                if (e.key === 'Escape') { setEditingViewTitle(false); setNewViewTitle(''); }
              }}
              placeholder="z.B. Wohnzimmer, Küche..."
              autoFocus
              style={{
                padding: '10px 12px',
                fontSize: 13,
                border: '2px solid #0b5cff',
                borderRadius: 6,
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={addView}
                disabled={!newViewTitle.trim()}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: newViewTitle.trim() ? '#28a745' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: newViewTitle.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                ✓ Hinzufügen
              </button>
              <button
                onClick={() => {
                  setEditingViewTitle(false);
                  setNewViewTitle('');
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                ✕ Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Center - Card List & Preview */}
      <div style={{ 
        padding: 24,
        overflowY: 'auto',
        background: '#f8f9fa'
      }}>
        {!currentView ? (
          <div style={{ 
            color: '#999', 
            textAlign: 'center', 
            paddingTop: 80,
            fontSize: 14
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Keine Ansicht ausgewählt</div>
            <div style={{ fontSize: 12 }}>Wähle links eine Ansicht aus oder erstelle eine neue</div>
          </div>
        ) : (
          <>
            {/* View Header */}
            <div style={{ 
              marginBottom: 24,
              background: 'linear-gradient(135deg, #0b5cff 0%, #0a4fd1 100%)',
              padding: 20,
              borderRadius: 12,
              color: '#fff',
              boxShadow: '0 4px 12px rgba(11,92,255,0.3)'
            }}>
              {currentView && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, marginBottom: 4, fontSize: 24 }}>{currentView.title}</h2>
                    <div style={{ fontSize: 13, opacity: 0.9 }}>
                      {currentView.cards.length === 0 
                        ? 'Keine Karten vorhanden' 
                        : `${currentView.cards.length} ${currentView.cards.length === 1 ? 'Karte' : 'Karten'}`}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newTitle = prompt('Neuer Titel:', currentView.title);
                      if (newTitle && newTitle.trim()) {
                        renameView(currentViewIdx, newTitle.trim());
                      }
                    }}
                    style={{
                      padding: '10px 16px',
                      background: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: '#fff',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.2)';
                    }}
                  >
                    <span>✏️</span>
                    <span>Umbenennen</span>
                  </button>
                </div>
              )}
            </div>

            {/* Cards List */}
            {currentView.cards.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 40,
                background: '#fff',
                borderRadius: 12,
                border: '2px dashed #dee2e6',
                marginBottom: 20
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎴</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 8 }}>
                  Noch keine Karten vorhanden
                </div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
                  Füge deine erste Karte hinzu, um zu starten
                </div>
                <button
                  onClick={() => setShowAddCardMenu(true)}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #0b5cff 0%, #0a4fd1 100%)',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(11,92,255,0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(11,92,255,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(11,92,255,0.3)';
                  }}
                >
                  ➕ Erste Karte hinzufügen
                </button>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 16,
                marginBottom: 24
              }}>
                {currentView.cards.map((card, idx) => (
                  <div
                    key={card.id}
                    onClick={() => {
                      setSelectedCardIdx(idx);
                      setEditingCardIdx(idx);
                      setShowCardModal(true);
                    }}
                    style={{
                      padding: 16,
                      background: selectedCardIdx === idx ? 'linear-gradient(135deg, #0b5cff 0%, #0a4fd1 100%)' : '#fff',
                      border: selectedCardIdx === idx ? 'none' : '2px solid #e9ecef',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: selectedCardIdx === idx ? '0 4px 16px rgba(11,92,255,0.4)' : '0 2px 6px rgba(0,0,0,0.08)'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCardIdx !== idx) {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCardIdx !== idx) {
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8
                    }}>
                      <span style={{ fontSize: 18 }}>{CardSchemas[card.type]?.icon || '📝'}</span>
                      <div style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: selectedCardIdx === idx ? 'rgba(255,255,255,0.9)' : '#0b5cff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {CardSchemas[card.type]?.label || card.type}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: selectedCardIdx === idx ? '#fff' : '#333',
                      marginBottom: 12,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {card.config.title || '(ohne Titel)'}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: 6,
                      justifyContent: 'space-between'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveCard(idx, 'up');
                        }}
                        disabled={idx === 0}
                        title="Nach oben verschieben"
                        style={{
                          padding: '6px 10px',
                          fontSize: 12,
                          background: idx === 0 ? 'transparent' : (selectedCardIdx === idx ? 'rgba(255,255,255,0.2)' : '#f8f9fa'),
                          border: `1px solid ${selectedCardIdx === idx ? 'rgba(255,255,255,0.3)' : '#dee2e6'}`,
                          color: selectedCardIdx === idx ? '#fff' : '#495057',
                          borderRadius: 6,
                          cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          opacity: idx === 0 ? 0.4 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        ⬆️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveCard(idx, 'down');
                        }}
                        disabled={idx === currentView.cards.length - 1}
                        title="Nach unten verschieben"
                        style={{
                          padding: '6px 10px',
                          fontSize: 12,
                          background: idx === currentView.cards.length - 1 ? 'transparent' : (selectedCardIdx === idx ? 'rgba(255,255,255,0.2)' : '#f8f9fa'),
                          border: `1px solid ${selectedCardIdx === idx ? 'rgba(255,255,255,0.3)' : '#dee2e6'}`,
                          color: selectedCardIdx === idx ? '#fff' : '#495057',
                          borderRadius: 6,
                          cursor: idx === currentView.cards.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: idx === currentView.cards.length - 1 ? 0.4 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Karte "${card.config.title || 'ohne Titel'}" wirklich löschen?`)) {
                            deleteCard(idx);
                          }
                        }}
                        title="Karte löschen"
                        style={{
                          padding: '6px 10px',
                          fontSize: 12,
                          background: selectedCardIdx === idx ? 'rgba(220,53,69,0.9)' : '#dc3545',
                          border: 'none',
                          color: 'white',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#c82333';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = selectedCardIdx === idx ? 'rgba(220,53,69,0.9)' : '#dc3545';
                        }}
                      >
                        🗑️ Löschen
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Card Button */}
                <button
                  onClick={() => setShowAddCardMenu(true)}
                  style={{
                    width: '100%',
                    padding: 20,
                    background: '#fff',
                    border: '3px dashed #0b5cff',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#0b5cff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f0f7ff';
                    e.target.style.borderColor = '#0a4fd1';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#fff';
                    e.target.style.borderColor = '#0b5cff';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: 24 }}>➕</span>
                  <span>Neue Karte hinzufügen</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal for Card Type Selection */}
      {showAddCardMenu && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowAddCardMenu(false)}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              maxWidth: 650,
              maxHeight: '85vh',
              overflow: 'auto',
              padding: 32
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 8,
              color: '#0b5cff',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <span>🎴</span>
              <span>Kartentyp auswählen</span>
            </div>
            <div style={{
              fontSize: 14,
              color: '#666',
              marginBottom: 24
            }}>
              Wähle den Typ der Karte, die du hinzufügen möchtest
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16
            }}>
              {Object.entries(CardSchemas).map(([type, schema]) => (
                <button
                  key={type}
                  onClick={() => {
                    addCard(type);
                    setShowAddCardMenu(false);
                  }}
                  style={{
                    padding: 20,
                    textAlign: 'left',
                    background: '#f8f9fa',
                    border: '2px solid #e9ecef',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)';
                    e.target.style.borderColor = '#0b5cff';
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 8px 16px rgba(11,92,255,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f8f9fa';
                    e.target.style.borderColor = '#e9ecef';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    fontSize: 32,
                    marginBottom: 10
                  }}>
                    {schema.icon}
                  </div>
                  <div style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#0b5cff',
                    marginBottom: 6
                  }}>
                    {schema.label}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: '#666',
                    lineHeight: 1.5
                  }}>
                    {schema.description}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddCardMenu(false)}
              style={{
                width: '100%',
                marginTop: 24,
                padding: 14,
                background: '#6c757d',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#5a6268';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#6c757d';
              }}
            >
              ✕ Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Card Edit Modal */}
      {showCardModal && editingCardIdx !== null && currentView?.cards[editingCardIdx] && (
        <CardEditModal
          card={currentView.cards[editingCardIdx]}
          onClose={() => {
            setShowCardModal(false);
            setEditingCardIdx(null);
          }}
          onSave={(updatedCard) => {
            updateCard(editingCardIdx, { config: updatedCard.config });
            setShowCardModal(false);
            setEditingCardIdx(null);
          }}
          entities={entitiesObj}
        />
      )}
    </div>
  );
}

/**
 * Card Edit Modal Component
 */
function CardEditModal({ card, onClose, onSave, entities = {} }) {
  const [localCard, setLocalCard] = useState(card);

  const handleFieldChange = (fieldName, value) => {
    setLocalCard({
      ...localCard,
      config: {
        ...localCard.config,
        [fieldName]: value
      }
    });
  };

  const handleSave = () => {
    onSave(localCard);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 2999,
          animation: 'fadeIn 0.2s ease',
          pointerEvents: 'auto'
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          zIndex: 3000,
          maxWidth: '95vw',
          width: 1200,
          maxHeight: '95vh',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease',
          pointerEvents: 'auto'
        }}
        onClick={() => console.log('Modal: click')}
        onMouseDown={() => console.log('Modal: mousedown')}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '2px solid #f0f0f0',
          background: 'linear-gradient(135deg, #0b5cff 0%, #0a4fd1 100%)',
          color: '#fff'
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              ✏️ Karte bearbeiten
            </div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>
              Typ: <strong>{card.type}</strong>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              fontSize: 24,
              cursor: 'pointer',
              padding: '0 8px',
              borderRadius: 4,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          >
            ✕
          </button>
        </div>

        {/* Content - Split Layout */}
        <div style={{
          flex: 1,
          display: 'flex',
          gap: 0,
          overflow: 'hidden',
          position: 'relative',
          pointerEvents: 'auto'
        }}>
          {/* Left Side - Form */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'visible',
            padding: '24px',
            borderRight: '2px solid #f0f0f0',
            position: 'relative',
            pointerEvents: 'auto'
          }}>
            <CardFormGenerator
              cardType={card.type}
              config={localCard.config}
              onConfigChange={handleFieldChange}
              entities={entities}
            />
          </div>

          {/* Right Side - Live Preview */}
          <div style={{
            flex: 1,
            padding: '24px',
            background: '#f8f9fa',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            pointerEvents: 'auto'
          }}>
            <div>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#0b5cff',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{ fontSize: 16 }}>👁️</span>
                <span>Live-Vorschau</span>
              </div>
              <div style={{
                background: '#fff',
                borderRadius: 8,
                border: '1px solid #ddd',
                padding: 16,
                minHeight: 300
              }}>
                <CardPreview card={localCard} entities={entities} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          gap: 12,
          padding: '16px 24px',
          borderTop: '2px solid #f0f0f0',
          background: '#f8f9fa'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#fff',
              border: '2px solid #ddd',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: '#333',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#999';
              e.target.style.background = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#ddd';
              e.target.style.background = '#fff';
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #0b5cff 0%, #0a4fd1 100%)',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(11,92,255,0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(11,92,255,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(11,92,255,0.3)';
            }}
          >
            ✓ Speichern
          </button>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translate(-50%, -40%);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
        `}</style>
      </div>
    </>
  );
}
