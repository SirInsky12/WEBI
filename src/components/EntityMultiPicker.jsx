import React, { useState, useMemo } from 'react';
import { getDomain } from '../models/dashboard.js';

/**
 * EntityMultiPicker Component
 * - Fuzzy search filtering
 * - Domain filter chips
 * - Checkbox multi-select
 * - Drag & drop reorder
 * - Inline overrides for each entity (name, icon, secondary_info, tap_action)
 */
export default function EntityMultiPicker({ 
  entities = {}, 
  selected = [], 
  onChange = () => {},
  maxItems = null,
  allowedDomains = null,
  overridesMap = {}
}) {
  const [searchText, setSearchText] = useState('');
  const [selectedAdapters, setSelectedAdapters] = useState([]);
  const [expandedEntity, setExpandedEntity] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [overrides, setOverrides] = useState(() => ({ ...overridesMap }));
  const [expandedAdapters, setExpandedAdapters] = useState({});

  // Extract entity list from store object
  const entityList = useMemo(() => {
    return Object.entries(entities).map(([id, entity]) => ({
      id,
      ...entity
    }));
  }, [entities]);

  // Get unique adapters (prefix before first dot) with counts
  const allAdapters = useMemo(() => {
    const adapters = {};
    entityList.forEach(e => {
      const adapter = (e.id || '').split('.')[0];
      if (adapter) {
        if (!adapters[adapter]) adapters[adapter] = 0;
        adapters[adapter]++;
      }
    });
    
    // Sort: common adapters first, then alphabetically
    const commonAdapters = ['alias', 'mqtt', '0_userdata', 'javascript', 'system', 'modbus'];
    return Object.keys(adapters).sort((a, b) => {
      const aIndex = commonAdapters.indexOf(a);
      const bIndex = commonAdapters.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    }).map(k => ({ name: k, count: adapters[k] }));
  }, [entityList]);

  // Group entities by adapter
  const entitiesByAdapter = useMemo(() => {
    const grouped = {};
    entityList.forEach(entity => {
      const adapter = (entity.id || '').split('.')[0];
      if (!grouped[adapter]) grouped[adapter] = [];
      grouped[adapter].push(entity);
    });
    return grouped;
  }, [entityList]);

  // Filter entities based on search
  const filteredEntitiesByAdapter = useMemo(() => {
    const result = {};
    
    Object.entries(entitiesByAdapter).forEach(([adapter, entities]) => {
      // Check adapter filter
      if (selectedAdapters.length > 0 && !selectedAdapters.includes(adapter)) {
        return;
      }
      
      const filtered = entities.filter(entity => {
        // Check search text
        if (searchText.trim()) {
          const query = searchText.toLowerCase();
          const entityId = entity.id.toLowerCase();
          const friendlyName = (entity.attributes?.friendly_name || '').toLowerCase();
          return entityId.includes(query) || friendlyName.includes(query);
        }
        return true;
      });
      
      if (filtered.length > 0) {
        result[adapter] = filtered;
      }
    });
    
    return result;
  }, [entitiesByAdapter, searchText, selectedAdapters]);

  const toggleAdapter = (adapter) => {
    setSelectedAdapters(prev => 
      prev.includes(adapter)
        ? prev.filter(a => a !== adapter)
        : [...prev, adapter]
    );
  };
  
  const toggleAdapterExpansion = (adapter) => {
    setExpandedAdapters(prev => ({
      ...prev,
      [adapter]: !prev[adapter]
    }));
  };

  const toggleEntitySelection = (entityId) => {
    const newSelected = selected.includes(entityId)
      ? selected.filter(id => id !== entityId)
      : selected.includes(entityId) ? selected : [...selected, entityId];

    // Respect max items
    if (maxItems && newSelected.length > maxItems) return;

    onChange(newSelected, overrides);
  };

  const moveEntity = (fromIdx, toIdx) => {
    const newSelected = [...selected];
    const [moved] = newSelected.splice(fromIdx, 1);
    newSelected.splice(toIdx, 0, moved);
    onChange(newSelected, overrides);
  };

  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    if (draggedItem !== null && draggedItem !== dropIdx) {
      moveEntity(draggedItem, dropIdx);
    }
    setDraggedItem(null);
  };

  const updateOverride = (entityId, field, value) => {
    setOverrides(prev => {
      const updated = {
        ...prev,
        [entityId]: {
          ...prev[entityId],
          [field]: value
        }
      };
      // Notify parent of the change
      onChange(selected, updated);
      return updated;
    });
  };

  const getEntityConfig = (entityId) => {
    const entity = entities[entityId];
    const override = overrides[entityId] || {};
    return {
      id: entityId,
      ...entity,
      ...override
    };
  };

  return (
    <div 
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Selected Entities - Top */}
      {selected.length > 0 && (
        <div style={{ 
          padding: 12, 
          background: '#f0f7ff', 
          borderRadius: 8,
          border: '1px solid #0b5cff'
        }}>
          <div style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            marginBottom: 12, 
            color: '#0b5cff'
          }}>
            Selected ({selected.length}{maxItems ? `/${maxItems}` : ''})
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selected.map((entityId, idx) => {
              const config = getEntityConfig(entityId);
              const isExpanded = expandedEntity === entityId;
              
              return (
                <div
                  key={entityId}
                  draggable
                  onDragStart={() => setDraggedItem(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, idx)}
                  style={{
                    padding: 8,
                    background: isExpanded ? '#fff' : '#ffffff88',
                    border: `1px solid ${isExpanded ? '#0b5cff' : '#ddd'}`,
                    borderRadius: 4,
                    cursor: 'grab',
                    opacity: draggedItem === idx ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 18 }}>≡</div>
                    <div style={{ flex: 1, fontSize: 12 }}>
                      <div style={{ fontWeight: 600 }}>
                        {config.attributes?.friendly_name || entityId}
                      </div>
                      <div style={{ color: '#666', fontSize: 11 }}>
                        {entityId}
                        {config.attributes?.unit_of_measurement && (
                          <span> • {config.attributes.unit_of_measurement}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedEntity(isExpanded ? null : entityId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 12,
                        padding: '4px 8px'
                      }}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                    <button
                      onClick={() => toggleEntitySelection(entityId)}
                      style={{
                        background: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eee' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>
                            Custom Name
                          </label>
                          <input
                            type="text"
                            value={overrides[entityId]?.name || ''}
                            onChange={(e) => updateOverride(entityId, 'name', e.target.value)}
                            placeholder="Leave empty for default"
                            style={{
                              width: '100%',
                              padding: '4px 6px',
                              fontSize: 11,
                              border: '1px solid #ddd',
                              borderRadius: 3,
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>
                            Icon
                          </label>
                          <input
                            type="text"
                            value={overrides[entityId]?.icon || ''}
                            onChange={(e) => updateOverride(entityId, 'icon', e.target.value)}
                            placeholder="mdi:lightbulb"
                            style={{
                              width: '100%',
                              padding: '4px 6px',
                              fontSize: 11,
                              border: '1px solid #ddd',
                              borderRadius: 3,
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>
                          Secondary Info
                        </label>
                        <input
                          type="text"
                          value={overrides[entityId]?.secondary_info || ''}
                          onChange={(e) => updateOverride(entityId, 'secondary_info', e.target.value)}
                          placeholder="e.g., last-changed"
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: 11,
                            border: '1px solid #ddd',
                            borderRadius: 3,
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div>
        <input
          type="text"
          placeholder="Filter entities..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 13,
            border: '1px solid #ddd',
            borderRadius: 6,
            marginBottom: 10,
            boxSizing: 'border-box'
          }}
        />

        {/* Adapter Filter Chips */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Filter by Adapter:</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {allAdapters.map(({ name, count }) => (
              <button
                key={name}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAdapter(name);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  padding: '6px 10px',
                  borderRadius: 14,
                  border: selectedAdapters.includes(name) ? '2px solid #0b5cff' : '1px solid #d1d5db',
                  background: selectedAdapters.includes(name) ? '#eef2ff' : '#fff',
                  color: selectedAdapters.includes(name) ? '#0b5cff' : '#6b7280',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: selectedAdapters.includes(name) ? 600 : 500,
                  transition: 'all 0.15s',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px'
                }}
              >
                {name} <span style={{ opacity: 0.7 }}>({count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Available Entities - Grouped by Adapter */}
      <div>
        <div style={{ 
          fontSize: 12, 
          fontWeight: 600, 
          marginBottom: 8, 
          color: '#374151'
        }}>
          Available Entities
        </div>
        
        {Object.keys(filteredEntitiesByAdapter).length === 0 ? (
          <div style={{ 
            padding: 16, 
            textAlign: 'center', 
            color: '#9ca3af', 
            fontSize: 13,
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            background: '#fafbfc'
          }}>
            No entities found
          </div>
        ) : (
          <div style={{ 
            maxHeight: 340,
            overflowY: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            background: '#fafbfc'
          }}>
            {Object.entries(filteredEntitiesByAdapter).map(([adapter, entities]) => {
              const isExpanded = expandedAdapters[adapter] !== false; // default expanded
              
              return (
                <div key={adapter} style={{ borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAdapterExpansion(adapter);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      background: isExpanded ? '#f8fafc' : '#fff',
                      fontWeight: 600,
                      fontSize: 12,
                      color: '#374151',
                      borderLeft: isExpanded ? '3px solid #0b5cff' : '3px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{adapter}</span>
                      <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11, marginLeft: 8 }}>
                        ({entities.length})
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{isExpanded ? '▼' : '▶'}</div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '4px 0' }}>
                      {entities.map(entity => {
                        const isSelected = selected.includes(entity.id);
                        const isDisabled = maxItems && selected.length >= maxItems && !isSelected;
                        
                        return (
                          <div
                            key={entity.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!isDisabled) {
                                toggleEntitySelection(entity.id);
                              }
                            }}
                            style={{
                              display: 'flex',
                              gap: 10,
                              padding: '8px 12px 8px 28px',
                              background: isSelected ? '#eef2ff' : 'transparent',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              fontSize: 12,
                              borderLeft: isSelected ? '3px solid #0b5cff' : '3px solid transparent',
                              transition: 'background 0.15s',
                              alignItems: 'center',
                              opacity: isDisabled ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => { 
                              if (!isSelected && !isDisabled) e.currentTarget.style.background = '#f8fafc'; 
                            }}
                            onMouseLeave={(e) => { 
                              if (!isSelected) e.currentTarget.style.background = 'transparent'; 
                            }}
                          >
                            {/* Custom Checkbox Visual */}
                            <div style={{
                              width: 16,
                              height: 16,
                              border: `2px solid ${isSelected ? '#0b5cff' : '#d1d5db'}`,
                              borderRadius: 3,
                              background: isSelected ? '#0b5cff' : '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'all 0.15s'
                            }}>
                              {isSelected && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path d="M1 5 L4 8 L9 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontWeight: selected.includes(entity.id) ? 600 : 400,
                              color: '#111827',
                              marginBottom: 2
                            }}>
                              {entity.attributes?.friendly_name || entity.id}
                            </div>
                            <div style={{ 
                              color: '#9ca3af', 
                              fontSize: 11, 
                              fontFamily: 'monospace',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {entity.id}
                            </div>
                          </div>
                          {(entity.state || entity.attributes?.unit_of_measurement) && (
                            <div style={{ 
                              textAlign: 'right',
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#374151',
                              flexShrink: 0,
                              marginLeft: 8
                            }}>
                              {entity.state}{entity.attributes?.unit_of_measurement ? ` ${entity.attributes.unit_of_measurement}` : ''}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
