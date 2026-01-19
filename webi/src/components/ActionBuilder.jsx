import React, { useState } from 'react';
import { ActionTypes, ServicePresets } from '../models/dashboard.js';

/**
 * ActionBuilder Component
 * Builds and edits action objects (tap_action, hold_action, double_tap_action)
 * Supports: toggle, more-info, navigate, call-service
 */
export default function ActionBuilder({ 
  action = null, 
  onChange = () => {},
  entities = {},
  label = 'Action'
}) {
  const [presetOpen, setPresetOpen] = useState(false);

  const actionType = action?.action || 'toggle';
  const currentSchema = ActionTypes[actionType];

  const handleActionTypeChange = (newType) => {
    const defaultValue = { action: newType };
    if (newType === 'call-service') {
      defaultValue.service = 'light.turn_on';
      defaultValue.service_data = {};
    }
    onChange(defaultValue);
  };

  const handleFieldChange = (field, value) => {
    onChange({
      ...action,
      [field]: value
    });
  };

  const handleServiceDataChange = (key, value) => {
    const newServiceData = { ...(action?.service_data || {}) };
    if (value === undefined || value === null || value === '') {
      delete newServiceData[key];
    } else {
      newServiceData[key] = value;
    }
    handleFieldChange('service_data', newServiceData);
  };

  const addServiceDataField = () => {
    handleServiceDataChange('', '');
  };

  return (
    <div style={{ 
      border: '1px solid #ddd', 
      borderRadius: 8, 
      padding: 12, 
      background: '#f9f9f9'
    }}>
      <div style={{ 
        fontSize: 12, 
        fontWeight: 600, 
        marginBottom: 8,
        color: '#333'
      }}>
        {label}
      </div>

      {/* Action Type Selector */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ 
          display: 'block',
          fontSize: 12, 
          fontWeight: 600, 
          marginBottom: 4,
          color: '#666'
        }}>
          Action Type
        </label>
        <select
          value={actionType}
          onChange={(e) => handleActionTypeChange(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: 12,
            border: '1px solid #ddd',
            borderRadius: 4,
            boxSizing: 'border-box'
          }}
        >
          {Object.entries(ActionTypes).map(([key, schema]) => (
            <option key={key} value={key}>
              {schema.label} - {schema.description}
            </option>
          ))}
        </select>
      </div>

      {/* Action-specific Fields */}
      {currentSchema && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(currentSchema.fields).map(([fieldName, fieldSchema]) => (
            <div key={fieldName}>
              <label style={{ 
                display: 'block',
                fontSize: 12, 
                fontWeight: 600, 
                marginBottom: 4,
                color: '#666'
              }}>
                {fieldSchema.label}
                {fieldSchema.required && ' *'}
              </label>

              {fieldSchema.type === 'entity-picker' ? (
                <select
                  value={action?.[fieldName] || ''}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: 12,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select entity...</option>
                  {Object.entries(entities).map(([id, entity]) => (
                    <option key={id} value={id}>
                      {entity.attributes?.friendly_name || id}
                    </option>
                  ))}
                </select>
              ) : fieldSchema.type === 'string' ? (
                <input
                  type="text"
                  value={action?.[fieldName] || ''}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  placeholder={fieldSchema.hint}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: 12,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    boxSizing: 'border-box'
                  }}
                />
              ) : null}

              {fieldSchema.hint && (
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                  {fieldSchema.hint}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Service Data Editor (for call-service) */}
      {actionType === 'call-service' && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #ddd' }}>
          <div style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            marginBottom: 8,
            color: '#333'
          }}>
            Service Data
          </div>

          {/* Presets */}
          <div style={{ marginBottom: 8 }}>
            <button
              onClick={() => setPresetOpen(!presetOpen)}
              style={{
                padding: '4px 8px',
                fontSize: 11,
                background: '#e3f2fd',
                border: '1px solid #0b5cff',
                color: '#0b5cff',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {presetOpen ? '▼' : '▶'} Common Services
            </button>

            {presetOpen && (
              <div style={{ 
                marginTop: 8, 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
                maxHeight: 200,
                overflowY: 'auto',
                padding: 8,
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: 4
              }}>
                {ServicePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onChange(preset.value);
                      setPresetOpen(false);
                    }}
                    style={{
                      padding: '6px 8px',
                      fontSize: 11,
                      background: '#f0f7ff',
                      border: '1px solid #0b5cff',
                      color: '#0b5cff',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontWeight: 500,
                      textAlign: 'left'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Service Data */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ 
              display: 'block',
              fontSize: 12, 
              fontWeight: 600, 
              marginBottom: 4,
              color: '#666'
            }}>
              Service
            </label>
            <input
              type="text"
              value={action?.service || ''}
              onChange={(e) => handleFieldChange('service', e.target.value)}
              placeholder="domain.service"
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: 12,
                border: '1px solid #ddd',
                borderRadius: 4,
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Key/Value Pairs */}
          <div style={{ 
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: 4,
            padding: 8
          }}>
            {Object.entries(action?.service_data || {}).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    if (e.target.value === key) return;
                    const oldVal = action.service_data[key];
                    delete action.service_data[key];
                    handleServiceDataChange(e.target.value, oldVal);
                  }}
                  placeholder="key"
                  style={{
                    flex: 0.4,
                    padding: '4px 6px',
                    fontSize: 11,
                    border: '1px solid #ddd',
                    borderRadius: 3,
                    boxSizing: 'border-box'
                  }}
                />
                <input
                  type="text"
                  value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  onChange={(e) => {
                    let val = e.target.value;
                    try {
                      val = JSON.parse(val);
                    } catch (e) {
                      // Keep as string
                    }
                    handleServiceDataChange(key, val);
                  }}
                  placeholder="value"
                  style={{
                    flex: 0.6,
                    padding: '4px 6px',
                    fontSize: 11,
                    border: '1px solid #ddd',
                    borderRadius: 3,
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={() => handleServiceDataChange(key, undefined)}
                  style={{
                    padding: '4px 6px',
                    background: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: 3,
                    cursor: 'pointer',
                    fontSize: 11,
                    flex: 0.1
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              onClick={addServiceDataField}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: 11,
                background: '#e3f2fd',
                border: '1px solid #0b5cff',
                color: '#0b5cff',
                borderRadius: 3,
                cursor: 'pointer',
                fontWeight: 600,
                marginTop: 6
              }}
            >
              + Add Parameter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
