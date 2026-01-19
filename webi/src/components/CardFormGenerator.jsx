import React, { useState } from 'react';
import { getCardSchema } from '../models/dashboard.js';
import EntityMultiPicker from './EntityMultiPicker.jsx';
import ActionBuilder from './ActionBuilder.jsx';

/**
 * CardFormGenerator Component
 * Automatically generates form controls from card schema
 * Supports all field types: string, number, boolean, select, textarea, etc.
 */
export default function CardFormGenerator({ 
  cardType = 'entities', 
  config = {}, 
  onChange = () => {}, 
  onConfigChange = undefined,
  entities = {},
  allCards = []
}) {
  const schema = getCardSchema(cardType);
  const [overrides, setOverrides] = useState({});

  if (!schema) {
    return (
      <div style={{ padding: 12, background: '#fff3cd', borderRadius: 4, color: '#856404' }}>
        Unknown card type: {cardType}
      </div>
    );
  }

  const handleFieldChange = (fieldName, value) => {
    const newConfig = { ...config, [fieldName]: value };
    const handler = onConfigChange || onChange || (() => {});
    try {
      if (typeof handler === 'function') {
        // If handler expects two args (fieldName, value), call that way
        if (handler.length >= 2) {
          handler(fieldName, value);
        } else {
          // Otherwise call with the new config object
          handler(newConfig);
        }
      }
    } catch (err) {
      console.warn('CardFormGenerator: handler error', err);
    }
  };

  const handleEntitiesChange = (selectedEntities, entityOverrides) => {
    const entities = selectedEntities.map(id => {
      const override = entityOverrides[id];
      if (override && Object.keys(override).length > 0) {
        return { entity_id: id, ...override };
      }
      return { entity_id: id };
    });
    handleFieldChange('entities', entities);
    setOverrides(entityOverrides);
  };

  const renderFieldControl = (fieldName, fieldSchema) => {
    const value = config[fieldName] !== undefined ? config[fieldName] : fieldSchema.default;

    // Special handling for entities-picker
    if (fieldSchema.type === 'entities-picker') {
      const selectedIds = Array.isArray(value) 
        ? value.map(e => typeof e === 'string' ? e : e.entity_id) 
        : [];
      const entityOverridesMap = {};
      if (Array.isArray(value)) {
        value.forEach(e => {
          if (typeof e === 'object' && e.entity_id) {
            const { entity_id, ...overrides } = e;
            if (Object.keys(overrides).length > 0) {
              entityOverridesMap[entity_id] = overrides;
            }
          }
        });
      }
      return (
        <EntityMultiPicker
          entities={entities}
          selected={selectedIds}
          overridesMap={entityOverridesMap}
          onChange={handleEntitiesChange}
        />
      );
    }

    switch (fieldSchema.type) {
      case 'string':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={fieldSchema.hint}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 14,
              border: '1px solid #ddd',
              borderRadius: 6,
              boxSizing: 'border-box',
              zIndex: 1001,
              position: 'relative',
              pointerEvents: 'auto'
            }}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value !== undefined ? value : ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value ? Number(e.target.value) : null)}
            min={fieldSchema.min}
            max={fieldSchema.max}
            step={fieldSchema.step || 1}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 14,
              border: '1px solid #ddd',
              borderRadius: 6,
              boxSizing: 'border-box',
              zIndex: 1001,
              position: 'relative',
              pointerEvents: 'auto'
            }}
          />
        );

      case 'boolean':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 1001 }}>
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
              style={{ cursor: 'pointer', pointerEvents: 'auto' }}
            />
            <span>{fieldSchema.hint || 'Enable this option'}</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value || fieldSchema.default || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 14,
              border: '1px solid #ddd',
              borderRadius: 6,
              boxSizing: 'border-box',
              zIndex: 1001,
              position: 'relative',
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
          >
            <option value="">Select...</option>
            {fieldSchema.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={fieldSchema.hint}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 14,
              border: '1px solid #ddd',
              borderRadius: 6,
              boxSizing: 'border-box',
              minHeight: 100,
              fontFamily: 'monospace',
              zIndex: 1001,
              position: 'relative',
              pointerEvents: 'auto'
            }}
          />
        );

      case 'entity-picker':
        // Group entities by adapter (prefix before first dot)
        const groupedByAdapter = Object.entries(entities || {}).reduce((acc, [id, entity]) => {
          const adapter = id.split('.')[0] || 'unknown';
          if (!acc[adapter]) acc[adapter] = [];
          acc[adapter].push({ id, label: entity.attributes?.friendly_name || id });
          return acc;
        }, {});

        return (
          <select
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 14,
              border: '1px solid #ddd',
              borderRadius: 6,
              boxSizing: 'border-box',
              zIndex: 1001,
              position: 'relative',
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
          >
            <option value="">Select entity...</option>
            {Object.entries(groupedByAdapter).map(([adapter, items]) => (
              <optgroup key={adapter} label={adapter}>
                {items.map(it => (
                  <option key={it.id} value={it.id}>{it.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        );

      case 'action':
        return (
          <ActionBuilder
            action={value}
            onChange={(newAction) => handleFieldChange(fieldName, newAction)}
            entities={entities}
            label={fieldSchema.label}
          />
        );

      case 'cards-picker':
        return (
          <div style={{ 
            padding: 12, 
            background: '#f9f9f9', 
            borderRadius: 6,
            border: '1px solid #ddd',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              {allCards.length} cards available
            </div>
            {(value || []).map((cardId, idx) => (
              <div key={cardId} style={{ 
                padding: 8, 
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: 4,
                marginBottom: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative'
              }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Card: {cardId}</span>
                <button
                  onClick={() => {
                    const newValue = value.filter((_, i) => i !== idx);
                    handleFieldChange(fieldName, newValue);
                  }}
                  style={{
                    padding: '4px 8px',
                    background: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: 3,
                    cursor: 'pointer',
                    fontSize: 11,
                    zIndex: 1001,
                    position: 'relative',
                    pointerEvents: 'auto'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        );

      case 'object':
        // Special handling for severity levels
        if (fieldName === 'severity') {
          const severity = value || { green: 0, yellow: 50, red: 80 };
          return (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
              gap: 9
            }}>
              {/* Green threshold */}
              <div style={{ 
                padding: '8px 10px', 
                background: '#f1f8f5', 
                border: '2px solid #4caf50',
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 5,
                  fontWeight: 600,
                  color: '#4caf50',
                  fontSize: 11
                }}>
                  <div style={{ 
                    width: 9, 
                    height: 9, 
                    borderRadius: '50%', 
                    background: '#4caf50'
                  }}></div>
                  <span>Green</span>
                </div>
                <input
                  type="number"
                  value={severity.green || 0}
                  onChange={(e) => handleFieldChange(fieldName, { 
                    ...severity, 
                    green: Number(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: '4px 5px',
                    fontSize: 11,
                    border: '1px solid #4caf50',
                    borderRadius: 3,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Yellow threshold */}
              <div style={{ 
                padding: '8px 10px', 
                background: '#fffef0', 
                border: '2px solid #ff9800',
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 5,
                  fontWeight: 600,
                  color: '#ff9800',
                  fontSize: 11
                }}>
                  <div style={{ 
                    width: 9, 
                    height: 9, 
                    borderRadius: '50%', 
                    background: '#ff9800'
                  }}></div>
                  <span>Yellow</span>
                </div>
                <input
                  type="number"
                  value={severity.yellow || 50}
                  onChange={(e) => handleFieldChange(fieldName, { 
                    ...severity, 
                    yellow: Number(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: '4px 5px',
                    fontSize: 11,
                    border: '1px solid #ff9800',
                    borderRadius: 3,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Red threshold */}
              <div style={{ 
                padding: '8px 10px', 
                background: '#fff5f5', 
                border: '2px solid #f44336',
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 5,
                  fontWeight: 600,
                  color: '#f44336',
                  fontSize: 11
                }}>
                  <div style={{ 
                    width: 9, 
                    height: 9, 
                    borderRadius: '50%', 
                    background: '#f44336'
                  }}></div>
                  <span>Red</span>
                </div>
                <input
                  type="number"
                  value={severity.red || 80}
                  onChange={(e) => handleFieldChange(fieldName, { 
                    ...severity, 
                    red: Number(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: '4px 5px',
                    fontSize: 11,
                    border: '1px solid #f44336',
                    borderRadius: 3,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          );
        }

        // Default object editor for other object types
        return (
          <textarea
            value={JSON.stringify(value || fieldSchema.default, null, 2)}
            onChange={(e) => {
              try {
                const obj = JSON.parse(e.target.value);
                handleFieldChange(fieldName, obj);
              } catch (err) {
                // Invalid JSON, don't update yet
              }
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 12,
              border: '1px solid #ddd',
              borderRadius: 6,
              boxSizing: 'border-box',
              minHeight: 80,
              fontFamily: 'monospace'
            }}
          />
        );

      default:
        return (
          <div style={{ color: '#999', fontSize: 12 }}>
            Unsupported field type: {fieldSchema.type}
          </div>
        );
    }
  };

  return (
    <div onClick={() => console.log('CardFormGenerator: click')} onMouseDown={() => console.log('CardFormGenerator: mousedown')} style={{ display: 'flex', flexDirection: 'column', gap: 16, pointerEvents: 'auto', position: 'relative', zIndex: 1001 }}>
      <div style={{ 
        padding: 12, 
        background: '#e3f2fd', 
        borderRadius: 6, 
        borderLeft: '4px solid #0b5cff'
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          {schema.label}
        </div>
        <div style={{ fontSize: 12, color: '#666' }}>
          {schema.description}
        </div>
      </div>

      {Object.entries(schema.fields).map(([fieldName, fieldSchema]) => (
        <div key={fieldName} style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1001 }}>
          <label style={{ 
            display: 'block',
            fontSize: 12, 
            fontWeight: 600, 
            marginBottom: 6,
            color: '#333'
          }}>
            {fieldSchema.label}
            {fieldSchema.required && <span style={{ color: '#dc3545' }}> *</span>}
          </label>

          {renderFieldControl(fieldName, fieldSchema)}

          {fieldSchema.hint && (
            <div style={{ 
              fontSize: 11, 
              color: '#666', 
              marginTop: 4,
              fontStyle: 'italic'
            }}>
              {fieldSchema.hint}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
