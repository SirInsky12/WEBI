/**
 * Mock Entity Store & Sample Dashboard Data
 * Provides demo data for testing the dashboard editor
 */

import { createEntity, createCard, createView, createDashboard, cardFromYAML } from './models/dashboard.js';

// ============================================
// MOCK ENTITY STORE (20+ entities)
// ============================================

export const mockEntities = {
  'light.living_room': createEntity('on', {
    friendly_name: 'Living Room Light',
    icon: 'mdi:lightbulb',
    brightness: 220,
    color_temp: 366,
    supported_color_modes: ['color_temp', 'rgb']
  }),
  'light.bedroom': createEntity('off', {
    friendly_name: 'Bedroom Light',
    icon: 'mdi:lightbulb',
    brightness: 0,
    supported_color_modes: ['color_temp']
  }),
  'light.kitchen': createEntity('on', {
    friendly_name: 'Kitchen Light',
    icon: 'mdi:lightbulb',
    brightness: 255,
    supported_color_modes: ['brightness']
  }),

  'switch.coffee_maker': createEntity('off', {
    friendly_name: 'Coffee Maker',
    icon: 'mdi:coffee-maker',
    device_class: 'outlet'
  }),
  'switch.washing_machine': createEntity('on', {
    friendly_name: 'Washing Machine',
    icon: 'mdi:washing-machine',
    device_class: 'outlet'
  }),
  'switch.garage_door': createEntity('closed', {
    friendly_name: 'Garage Door',
    icon: 'mdi:garage',
    device_class: 'garage_door'
  }),

  'climate.living_room': createEntity('heat', {
    friendly_name: 'Living Room Thermostat',
    icon: 'mdi:thermostat',
    current_temperature: 21.5,
    target_temperature: 22,
    hvac_action: 'heating',
    min_temp: 15,
    max_temp: 30,
    hvac_modes: ['off', 'heat', 'cool', 'auto'],
    unit_of_measurement: '°C'
  }),
  'climate.bedroom': createEntity('auto', {
    friendly_name: 'Bedroom Climate',
    icon: 'mdi:thermostat',
    current_temperature: 19.8,
    target_temperature: 20,
    hvac_action: 'idle',
    min_temp: 15,
    max_temp: 30,
    hvac_modes: ['off', 'heat', 'cool', 'auto'],
    unit_of_measurement: '°C'
  }),

  'sensor.temperature_living_room': createEntity(21.5, {
    friendly_name: 'Living Room Temperature',
    icon: 'mdi:thermometer',
    device_class: 'temperature',
    unit_of_measurement: '°C'
  }),
  'sensor.humidity_living_room': createEntity(45, {
    friendly_name: 'Living Room Humidity',
    icon: 'mdi:water-percent',
    device_class: 'humidity',
    unit_of_measurement: '%'
  }),
  'sensor.temperature_bedroom': createEntity(19.8, {
    friendly_name: 'Bedroom Temperature',
    icon: 'mdi:thermometer',
    device_class: 'temperature',
    unit_of_measurement: '°C'
  }),
  'sensor.humidity_bedroom': createEntity(52, {
    friendly_name: 'Bedroom Humidity',
    icon: 'mdi:water-percent',
    device_class: 'humidity',
    unit_of_measurement: '%'
  }),

  'binary_sensor.motion_living_room': createEntity('off', {
    friendly_name: 'Living Room Motion',
    icon: 'mdi:motion-sensor',
    device_class: 'motion'
  }),
  'binary_sensor.door_front': createEntity('off', {
    friendly_name: 'Front Door',
    icon: 'mdi:door',
    device_class: 'door'
  }),
  'binary_sensor.window_living_room': createEntity('off', {
    friendly_name: 'Living Room Window',
    icon: 'mdi:window-closed',
    device_class: 'window'
  }),

  'media_player.living_room': createEntity('idle', {
    friendly_name: 'Living Room TV',
    icon: 'mdi:television',
    volume_level: 0.5,
    source: 'HDMI 1',
    source_list: ['HDMI 1', 'HDMI 2', 'Streaming']
  }),
  'media_player.bedroom': createEntity('playing', {
    friendly_name: 'Bedroom Speaker',
    icon: 'mdi:speaker',
    volume_level: 0.7,
    media_title: 'Summer Hits'
  }),

  'input_number.target_temp': createEntity(22, {
    friendly_name: 'Target Temperature',
    icon: 'mdi:thermometer',
    min: 15,
    max: 30,
    step: 0.5,
    unit_of_measurement: '°C'
  }),
  'input_select.scene': createEntity('Evening', {
    friendly_name: 'Scene',
    icon: 'mdi:palette',
    options: ['Morning', 'Day', 'Evening', 'Night', 'Movie']
  })
};

// ============================================
// SAMPLE DASHBOARD YAML
// ============================================

export const sampleDashboardYAML = `
views:
  - id: home
    title: Home
    cards:
      - type: vertical-stack
        cards:
          - type: entities
            title: Lights
            entities:
              - entity_id: light.living_room
                name: Living Room
                icon: mdi:lightbulb
              - entity_id: light.bedroom
                name: Bedroom
              - entity_id: light.kitchen
                name: Kitchen
          
          - type: button
            title: All Lights Off
            icon: mdi:lightbulb-off
            tap_action:
              action: call-service
              service: light.turn_off
              service_data: {}
      
      - type: horizontal-stack
        cards:
          - type: gauge
            title: Living Room Temp
            entity: sensor.temperature_living_room
            min: 10
            max: 30
            severity:
              green: 18
              yellow: 24
              red: 28
          
          - type: gauge
            title: Living Room Humidity
            entity: sensor.humidity_living_room
            min: 0
            max: 100
            unit: '%'
            severity:
              green: 30
              yellow: 60
              red: 80
      
      - type: entities
        title: Switches
        entities:
          - entity_id: switch.coffee_maker
            name: Coffee Maker
            icon: mdi:coffee-maker
          - entity_id: switch.washing_machine
            name: Washing Machine
          - entity_id: switch.garage_door
            name: Garage Door
      
      - type: markdown
        title: Welcome
        content: |
          # Welcome to Dashboard
          
          This is a sample dashboard with various card types.
          
          - **Lights**: Control your lights
          - **Climate**: Adjust temperature
          - **Sensors**: Monitor environment
  
  - id: climate
    title: Climate
    cards:
      - type: vertical-stack
        cards:
          - type: entities
            title: Thermostats
            entities:
              - entity_id: climate.living_room
                name: Living Room
              - entity_id: climate.bedroom
                name: Bedroom
          
          - type: grid
            columns: 2
            cards:
              - type: gauge
                title: Living Room Temp
                entity: sensor.temperature_living_room
                min: 15
                max: 30
                severity:
                  green: 20
                  yellow: 25
                  red: 28
              
              - type: gauge
                title: Living Room Humidity
                entity: sensor.humidity_living_room
                min: 0
                max: 100
              
              - type: gauge
                title: Bedroom Temp
                entity: sensor.temperature_bedroom
                min: 15
                max: 30
              
              - type: gauge
                title: Bedroom Humidity
                entity: sensor.humidity_bedroom
                min: 0
                max: 100
`;

// ============================================
// CONVERT YAML TO DASHBOARD STRUCTURE
// ============================================

/**
 * Parse YAML-like dashboard structure to Dashboard model
 * In real app, this would use a proper YAML parser
 */
export const parseYAMLDashboard = (yamlString) => {
  try {
    // Simple YAML-like parser (replace with proper yaml package in production)
    const obj = eval('(' + yamlString.replace(/^- type:/gm, '').replace(/^  /gm, '') + ')');
    return obj;
  } catch (e) {
    console.error('Failed to parse YAML:', e);
    return null;
  }
};

/**
 * Create sample dashboard with cards from YAML
 */
export const createSampleDashboard = () => {
  const dashboard = createDashboard([
    createView('home', 'Home', [
      createCard('card-entities-lights', 'entities', {
        title: 'Lights',
        entities: [
          {
            entity_id: 'light.living_room',
            name: 'Living Room',
            icon: 'mdi:lightbulb'
          },
          {
            entity_id: 'light.bedroom',
            name: 'Bedroom'
          },
          {
            entity_id: 'light.kitchen',
            name: 'Kitchen'
          }
        ],
        show_header_toggle: true
      }),
      
      createCard('card-button-lights-off', 'button', {
        title: 'All Lights Off',
        icon: 'mdi:lightbulb-off',
        tap_action: {
          action: 'call-service',
          service: 'light.turn_off',
          service_data: {}
        }
      }),
      
      createCard('card-gauge-temp', 'gauge', {
        title: 'Living Room Temperature',
        entity: 'sensor.temperature_living_room',
        min: 10,
        max: 30,
        unit: '°C'
      }),
      
      createCard('card-entities-switches', 'entities', {
        title: 'Switches',
        entities: [
          { entity_id: 'switch.coffee_maker', name: 'Coffee Maker' },
          { entity_id: 'switch.washing_machine', name: 'Washing Machine' },
          { entity_id: 'switch.garage_door', name: 'Garage Door' }
        ]
      }),
      
      createCard('card-markdown-welcome', 'markdown', {
        title: 'Welcome',
        content: '# Welcome to Dashboard\n\nThis is your new dashboard.'
      })
    ]),
    
    createView('climate', 'Climate Control', [
      createCard('card-entities-climate', 'entities', {
        title: 'Thermostats',
        entities: [
          { entity_id: 'climate.living_room', name: 'Living Room' },
          { entity_id: 'climate.bedroom', name: 'Bedroom' }
        ]
      }),
      
      createCard('card-gauge-humidity', 'gauge', {
        title: 'Humidity',
        entity: 'sensor.humidity_living_room',
        min: 0,
        max: 100,
        unit: '%'
      })
    ])
  ]);

  return dashboard;
};

// ============================================
// EXPORT DASHBOARD
// ============================================

/**
 * Export dashboard to YAML-compatible format
 */
export const exportDashboardToYAML = (dashboard) => {
  const views = dashboard.views.map(view => ({
    id: view.id,
    title: view.title,
    cards: view.cards.map(card => ({
      type: card.type,
      ...card.config,
      ...card.rawUnknown
    }))
  }));

  return JSON.stringify({ views }, null, 2);
};

/**
 * Export dashboard to JSON
 */
export const exportDashboardToJSON = (dashboard) => {
  return JSON.stringify(dashboard, null, 2);
};
