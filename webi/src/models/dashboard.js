/**
 * Dashboard Data Model & Schemas
 * Defines the structure for dashboard, cards, and entity store
 */

// ============================================
// DATA MODEL STRUCTURES
// ============================================

/**
 * Main Dashboard structure
 * @typedef {Object} Dashboard
 * @property {Array} views - Array of view objects
 */
export const createDashboard = (views = []) => ({
  views
});

/**
 * View/Page structure
 * @typedef {Object} View
 * @property {string} id - Unique view ID
 * @property {string} title - View title
 * @property {Array} cards - Array of card objects
 */
export const createView = (id, title = 'Untitled', cards = []) => ({
  id,
  title,
  cards
});

/**
 * Card structure - base for all card types
 * @typedef {Object} Card
 * @property {string} id - Unique card ID
 * @property {string} type - Card type (entities, button, gauge, markdown, grid, vertical-stack, horizontal-stack)
 * @property {Object} config - Card configuration (type-specific)
 * @property {Object} rawUnknown - Unknown fields to preserve on import/export
 */
export const createCard = (id, type, config = {}, rawUnknown = {}) => ({
  id,
  type,
  config,
  rawUnknown
});

/**
 * Entity Store - maps entity_id to entity state/attributes
 * @typedef {Object} Entity
 * @property {string|number|boolean} state - Current state value
 * @property {Object} attributes - Entity attributes (friendly_name, icon, unit_of_measurement, etc.)
 * @property {string} last_changed - ISO timestamp of last change
 */
export const createEntity = (state = null, attributes = {}, last_changed = new Date().toISOString()) => ({
  state,
  attributes,
  last_changed
});

// ============================================
// CARD TYPE SCHEMAS
// ============================================

/**
 * Schema defines the structure, types, defaults, UI hints, and validators for a card type
 */
export const CardSchemas = {
  // Entities card - displays multiple entities with names, icons, tap actions
  entities: {
    label: 'Entities',
    description: 'Display one or more entity states with customizable appearance and actions',
    icon: '📊',
    fields: {
      title: {
        type: 'string',
        label: 'Title',
        default: '',
        required: false,
        hint: 'Optional header text'
      },
      entities: {
        type: 'entities-picker',
        label: 'Entities',
        default: [],
        required: true,
        hint: 'Select entities to display',
        description: 'Each entity can have custom name, icon, and tap actions'
      },
      show_header_toggle: {
        type: 'boolean',
        label: 'Show header toggle',
        default: true,
        hint: 'Toggle all entities on/off from header'
      },
      show_entity_picture: {
        type: 'boolean',
        label: 'Show entity picture',
        default: false
      },
      theme: {
        type: 'select',
        label: 'Theme',
        default: 'default',
        options: [
          { value: 'default', label: 'Default' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' }
        ]
      }
    }
  },

  // Button card - clickable button with action
  button: {
    label: 'Button',
    description: 'Clickable button with customizable actions',
    icon: '🔘',
    fields: {
      title: {
        type: 'string',
        label: 'Button title',
        default: 'Click me',
        required: true
      },
      icon: {
        type: 'string',
        label: 'Icon',
        default: 'mdi:button-outline',
        hint: 'Material Design Icons (mdi:*)'
      },
      tap_action: {
        type: 'action',
        label: 'On tap',
        default: { action: 'toggle' },
        required: true
      },
      hold_action: {
        type: 'action',
        label: 'On hold',
        default: null
      },
      double_tap_action: {
        type: 'action',
        label: 'On double tap',
        default: null
      },
      color: {
        type: 'select',
        label: 'Color',
        default: 'primary',
        options: [
          { value: 'primary', label: 'Primary' },
          { value: 'success', label: 'Success' },
          { value: 'warning', label: 'Warning' },
          { value: 'danger', label: 'Danger' }
        ]
      }
    }
  },

  // Gauge card - circular or linear gauge display
  gauge: {
    label: 'Gauge',
    description: 'Visual gauge displaying numeric entity values',
    icon: '📈',
    fields: {
      title: {
        type: 'string',
        label: 'Title',
        default: '',
        required: false
      },
      entity: {
        type: 'entity-picker',
        label: 'Entity',
        default: null,
        required: true,
        hint: 'Select a numeric entity'
      },
      gauge_type: {
        type: 'select',
        label: 'Gauge Type',
        default: 'semicircle',
        options: [
          { value: 'semicircle', label: 'Semicircle' },
          { value: 'circle', label: 'Circle' },
          { value: 'linear', label: 'Linear' }
        ]
      },
      min: {
        type: 'number',
        label: 'Minimum value',
        default: 0
      },
      max: {
        type: 'number',
        label: 'Maximum value',
        default: 100
      },
      severity: {
        type: 'object',
        label: 'Severity levels',
        default: { green: 0, yellow: 50, red: 80 },
        hint: 'Value thresholds for color changes'
      },
      unit: {
        type: 'string',
        label: 'Unit of measurement',
        default: '',
        hint: 'e.g., °C, %'
      }
    }
  },

  // Solar card - display solar/energy flow diagram
  solar: {
    label: 'Solar',
    description: 'Animated solar energy flow diagram showing Solar, Consumption, and Grid',
    icon: '☀️',
    fields: {
      title: {
        type: 'string',
        label: 'Title',
        default: '',
        required: false
      },
      solar_entity: {
        type: 'entity-picker',
        label: 'Solar Production',
        default: null,
        required: true,
        hint: 'Entity for solar power output (W)'
      },
      consumption_entity: {
        type: 'entity-picker',
        label: 'House Consumption',
        default: null,
        required: true,
        hint: 'Entity for house power consumption (W)'
      },
      grid_entity: {
        type: 'entity-picker',
        label: 'Grid Power',
        default: null,
        required: true,
        hint: 'Entity for grid power (positive=export, negative=import)'
      },
      theme: {
        type: 'select',
        label: 'Theme',
        default: 'default',
        options: [
          { value: 'default', label: 'Default (White)' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' }
        ]
      }
    }
  },

  // Battery card - shows battery level, charging and discharging flows
  battery: {
    label: 'Battery',
    description: 'Display battery level with charging/discharging inputs',
    icon: '🔋',
    fields: {
      title: {
        type: 'string',
        label: 'Title',
        default: '',
        required: false
      },
      state_entity: {
        type: 'entity-picker',
        label: 'Ist (Batteriestand)',
        default: null,
        required: true,
        hint: 'Entity, die den Batterieprozentsatz (0-100) liefert'
      },
      charging_entity: {
        type: 'entity-picker',
        label: 'Laden (Entity)',
        default: null,
        required: false,
        hint: 'Entity für Ladeleistung (W)'
      },
      discharging_entity: {
        type: 'entity-picker',
        label: 'Entladen (Entity)',
        default: null,
        required: false,
        hint: 'Entity für Entladeleistung (W)'
      },
      power_entity: {
        type: 'entity-picker',
        label: 'Lade-/Entladeleistung (kombiniert)',
        default: null,
        required: false,
        hint: 'Entity mit positiver Ladeleistung und negativer Entladeleistung (W). Wird priorisiert, wenn gesetzt.'
      },
      show_percentage: {
        type: 'boolean',
        label: 'Show Percentage',
        default: true
      },
      theme: {
        type: 'select',
        label: 'Theme',
        default: 'default',
        options: [
          { value: 'default', label: 'Default' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' }
        ]
      }
    }
  },

  // Markdown card - display markdown/HTML content
  markdown: {
    label: 'Markdown',
    description: 'Display markdown or HTML content with optional entity state templating',
    icon: '📝',
    fields: {
      title: {
        type: 'string',
        label: 'Title',
        default: '',
        required: false
      },
      content: {
        type: 'textarea',
        label: 'Content',
        default: '# Hello\n\nEdit this markdown...',
        required: true,
        hint: 'Supports markdown and HTML'
      }
    }
  },

  // Layout cards - container cards for organizing other cards
  'vertical-stack': {
    label: 'Vertical Stack',
    description: 'Stack cards vertically',
    icon: '📑',
    fields: {
      cards: {
        type: 'cards-picker',
        label: 'Cards',
        default: [],
        required: true,
        hint: 'Drag cards to reorder'
      }
    }
  },

  'horizontal-stack': {
    label: 'Horizontal Stack',
    description: 'Stack cards horizontally (in a row)',
    icon: '📐',
    fields: {
      cards: {
        type: 'cards-picker',
        label: 'Cards',
        default: [],
        required: true,
        hint: 'Drag cards to reorder'
      }
    }
  },

  grid: {
    label: 'Grid',
    description: 'Arrange cards in a responsive grid',
    icon: '🔲',
    fields: {
      columns: {
        type: 'number',
        label: 'Columns',
        default: 2,
        min: 1,
        max: 12
      },
      cards: {
        type: 'cards-picker',
        label: 'Cards',
        default: [],
        required: true
      }
    }
  }
};

// ============================================
// ACTION TYPES & PRESETS
// ============================================

export const ActionTypes = {
  toggle: {
    label: 'Toggle',
    description: 'Toggle entity on/off',
    fields: {
      entity_id: {
        type: 'entity-picker',
        label: 'Entity',
        required: true
      }
    }
  },
  'more-info': {
    label: 'More Info',
    description: 'Open entity details dialog',
    fields: {
      entity_id: {
        type: 'entity-picker',
        label: 'Entity',
        required: true
      }
    }
  },
  navigate: {
    label: 'Navigate',
    description: 'Navigate to URL or page',
    fields: {
      navigation_path: {
        type: 'string',
        label: 'Path',
        required: true,
        hint: 'e.g., /lovelace/settings or https://example.com'
      }
    }
  },
  'call-service': {
    label: 'Call Service',
    description: 'Call a Home Assistant service',
    fields: {
      service: {
        type: 'string',
        label: 'Service',
        required: true,
        hint: 'Format: domain.service'
      },
      service_data: {
        type: 'object',
        label: 'Service data',
        default: {},
        hint: 'Key-value pairs for service parameters'
      }
    }
  }
};

// Common service presets for call-service actions
export const ServicePresets = [
  {
    label: 'Light: Turn On',
    value: { action: 'call-service', service: 'light.turn_on', service_data: {} }
  },
  {
    label: 'Light: Turn Off',
    value: { action: 'call-service', service: 'light.turn_off', service_data: {} }
  },
  {
    label: 'Light: Toggle',
    value: { action: 'call-service', service: 'light.toggle', service_data: {} }
  },
  {
    label: 'Switch: Turn On',
    value: { action: 'call-service', service: 'switch.turn_on', service_data: {} }
  },
  {
    label: 'Switch: Turn Off',
    value: { action: 'call-service', service: 'switch.turn_off', service_data: {} }
  },
  {
    label: 'Switch: Toggle',
    value: { action: 'call-service', service: 'switch.toggle', service_data: {} }
  },
  {
    label: 'Climate: Set Temperature',
    value: { action: 'call-service', service: 'climate.set_temperature', service_data: { temperature: 21 } }
  },
  {
    label: 'Automation: Trigger',
    value: { action: 'call-service', service: 'automation.trigger', service_data: {} }
  },
  {
    label: 'Scene: Activate',
    value: { action: 'call-service', service: 'scene.turn_on', service_data: {} }
  }
];

// ============================================
// UTILITIES
// ============================================

/**
 * Get schema for a card type
 */
export const getCardSchema = (cardType) => {
  return CardSchemas[cardType] || null;
};

/**
 * Validate a card against its schema
 */
export const validateCard = (card) => {
  const schema = getCardSchema(card.type);
  if (!schema) return { valid: false, errors: [`Unknown card type: ${card.type}`] };

  const errors = [];
  const { fields } = schema;

  for (const [fieldName, fieldSchema] of Object.entries(fields)) {
    const value = card.config[fieldName];

    if (fieldSchema.required && (value === undefined || value === null || value === '')) {
      errors.push(`Field '${fieldName}' is required`);
    }

    if (fieldSchema.type === 'number' && value !== undefined && typeof value !== 'number') {
      errors.push(`Field '${fieldName}' must be a number`);
    }

    if (fieldSchema.type === 'string' && value !== undefined && typeof value !== 'string') {
      errors.push(`Field '${fieldName}' must be a string`);
    }

    if (fieldSchema.type === 'boolean' && value !== undefined && typeof value !== 'boolean') {
      errors.push(`Field '${fieldName}' must be a boolean`);
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Convert card to/from YAML-compatible format (preserving unknown fields)
 */
export const cardToYAML = (card) => {
  const yaml = {
    type: card.type,
    ...card.config,
    ...card.rawUnknown
  };
  return yaml;
};

export const cardFromYAML = (yamlObj, id = null) => {
  const { type, ...rest } = yamlObj;

  // Try to identify known fields based on schema
  const schema = getCardSchema(type);
  const config = {};
  const rawUnknown = {};

  if (schema) {
    for (const [key, value] of Object.entries(rest)) {
      if (schema.fields[key]) {
        config[key] = value;
      } else {
        rawUnknown[key] = value;
      }
    }
  } else {
    // Unknown type - preserve all as rawUnknown
    Object.assign(rawUnknown, rest);
  }

  return createCard(id || `card-${Date.now()}`, type, config, rawUnknown);
};

/**
 * Get domains from entity IDs (light.living_room -> 'light')
 */
export const getDomain = (entityId) => {
  return entityId?.split('.')[0] || null;
};

/**
 * Get all unique domains from entity list
 */
export const getUniqueDomains = (entities) => {
  const domains = new Set();
  entities.forEach(e => {
    const domain = getDomain(e.id || e);
    if (domain) domains.add(domain);
  });
  return Array.from(domains).sort();
};
