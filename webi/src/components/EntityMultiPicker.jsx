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
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [selectedAdapters, setSelectedAdapters] = useState([]);
  const [expandedEntity, setExpandedEntity] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [overrides, setOverrides] = useState(() => ({ ...overridesMap }));

  // Extract entity list from store object
  const entityList = useMemo(() => {
    return Object.entries(entities).map(([id, entity]) => ({
      id,
      ...entity
    }));
  }, [entities]);

  // Get unique domains
  const allDomains = useMemo(() => {
    const domains = new Set();
    entityList.forEach(e => {
      const domain = getDomain(e.id);
      if (domain && (!allowedDomains || allowedDomains.includes(domain))) {
        domains.add(domain);
      }
    });
    return Array.from(domains).sort();
  }, [entityList, allowedDomains]);

  // Get unique adapters (prefix before first dot)
  const allAdapters = useMemo(() => {
    const adapters = new Set();
    entityList.forEach(e => {
      const adapter = (e.id || '').split('.')[0];
      if (adapter) adapters.add(adapter);
    });
    return Array.from(adapters).sort();
  }, [entityList]);

  // Filter entities based on search and domain
  const filteredEntities = useMemo(() => {
    return entityList.filter(entity => {
      const domain = getDomain(entity.id);
      
      // Check domain filter
      if (selectedDomains.length > 0 && !selectedDomains.includes(domain)) {
        return false;
      }

      // Check adapter filter
      const adapter = (entity.id || '').split('.')[0];
      if (selectedAdapters.length > 0 && !selectedAdapters.includes(adapter)) {
        return false;
      }

      // Check search text (fuzzy match)
      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        const entityId = entity.id.toLowerCase();
        const friendlyName = (entity.attributes?.friendly_name || '').toLowerCase();
        
        // Simple fuzzy: all query chars must appear in order
        let searchIdx = 0;
        for (let i = 0; i < entityId.length && searchIdx < query.length; i++) {
          if (entityId[i] === query[searchIdx]) searchIdx++;
        }
        if (searchIdx === query.length) return true;

        // Or check friendly name
        return friendlyName.includes(query);
      }

      return true;
    });
  }, [entityList, searchText, selectedDomains]);

  const toggleDomain = (domain) => {
    setSelectedDomains(prev => 
      prev.includes(domain)
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    );
  };

  const toggleAdapter = (adapter) => {
    setSelectedAdapters(prev => 
      prev.includes(adapter)
        ? prev.filter(a => a !== adapter)
        : [...prev, adapter]
    );
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          placeholder="Search entities (name, ID)..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid #ddd',
            borderRadius: 6,
            marginBottom: 8,
            boxSizing: 'border-box'
          }}
        />

        {/* Domain Filter Chips */}
        {allDomains.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {allDomains.map(domain => (
              <button
                key={domain}
                onClick={() => toggleDomain(domain)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 16,
                  border: selectedDomains.includes(domain) ? '2px solid #0b5cff' : '1px solid #ddd',
                  background: selectedDomains.includes(domain) ? '#e3f2fd' : '#fff',
                  color: selectedDomains.includes(domain) ? '#0b5cff' : '#333',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: selectedDomains.includes(domain) ? 600 : 400,
                  transition: 'all 0.2s'
                }}
              >
                {domain}
              </button>
            ))}
          </div>
        )}
        {/* Adapter Filter Chips */}
        {allAdapters.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {allAdapters.map(adapter => (
              <button
                key={adapter}
                onClick={() => toggleAdapter(adapter)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 16,
                  border: selectedAdapters.includes(adapter) ? '2px solid #0b5cff' : '1px solid #ddd',
                  background: selectedAdapters.includes(adapter) ? '#e3f2fd' : '#fff',
                  color: selectedAdapters.includes(adapter) ? '#0b5cff' : '#333',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: selectedAdapters.includes(adapter) ? 600 : 400,
                  transition: 'all 0.2s'
                }}
              >
                {adapter}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Available Entities */}
      <div>
        <div style={{ 
          fontSize: 12, 
          fontWeight: 600, 
          marginBottom: 8, 
          color: '#666'
        }}>
          Available ({filteredEntities.length})
        </div>
        
        {filteredEntities.length === 0 ? (
          <div style={{ 
            padding: 12, 
            textAlign: 'center', 
            color: '#999', 
            fontSize: 12,
            border: '1px solid #eee',
            borderRadius: 4
          }}>
            No entities found
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 6,
            maxHeight: 300,
            overflowY: 'auto',
            border: '1px solid #eee',
            borderRadius: 4,
            padding: 6
          }}>
            {filteredEntities.map(entity => (
              <label
                key={entity.id}
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: 8,
                  background: selected.includes(entity.id) ? '#e3f2fd' : '#fff',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  border: selected.includes(entity.id) ? '1px solid #0b5cff' : '1px solid transparent',
                  transition: 'all 0.2s',
                  alignItems: 'center'
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(entity.id)}
                  onChange={() => toggleEntitySelection(entity.id)}
                  disabled={maxItems && selected.length >= maxItems && !selected.includes(entity.id)}
                  style={{ cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>
                    {entity.attributes?.friendly_name || entity.id}
                  </div>
                  <div style={{ color: '#666', fontSize: 11 }}>
                    {entity.id} • {entity.state}
                    {entity.attributes?.unit_of_measurement && (
                      <span> • {entity.attributes.unit_of_measurement}</span>
                    )}
                  </div>
                </div>
                {entity.attributes?.icon && (
                  <span style={{ fontSize: 14 }}>📌</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
