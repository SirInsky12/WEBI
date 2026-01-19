# Dashboard Editor - Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           React App                              │
│                        (src/App.jsx)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Route Selection                                                 │
│  ├── Dashboard (ioBroker original)                              │
│  ├── 📝 Editor (DashboardEditor)                                │
│  └── ✓ Validation (ValidationDemo)                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DashboardEditor (Main)                        │
│                   src/DashboardEditor.jsx                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Left Sidebar   │  │ Center Panel │  │ Right Sidebar    │   │
│  │ - View List    │  │ - Card Grid  │  │ - Form Generator │   │
│  │ - Add View     │  │ - Add Card   │  │ - Live Preview   │   │
│  │ - Delete View  │  │ - Reorder    │  │                  │   │
│  │ - Rename View  │  │ - Delete     │  │                  │   │
│  └────────────────┘  └──────────────┘  └──────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
        │                    │                    │
        │                    │                    │
        ▼                    ▼                    ▼
    (State)            (State)            (State)
    views[]         selectedCard      formConfig
    currentViewIdx  selectedCardIdx    selectedCard
```

## Component Hierarchy

```
App (routes)
│
├── Dashboard (ioBroker)
│   └── original functionality
│
├── DashboardEditor
│   ├── Left: ViewList
│   │   ├── View buttons
│   │   └── Add view form
│   │
│   ├── Center: CardGrid
│   │   ├── CardListItem (multiple)
│   │   │   ├── Up/Down buttons
│   │   │   └── Delete button
│   │   │
│   │   └── AddCardMenu
│   │       └── CardTypeOptions
│   │
│   └── Right: CardEditor
│       ├── CardFormGenerator
│       │   ├── EntityMultiPicker
│       │   │   ├── SearchInput
│       │   │   ├── DomainFilter
│       │   │   ├── SelectedList
│       │   │   │   └── EntityItem (with drag/drop)
│       │   │   └── AvailableList
│       │   │
│       │   └── ActionBuilder
│       │       ├── ActionTypeSelect
│       │       ├── FieldInputs
│       │       └── ServiceDataEditor
│       │
│       └── CardPreview
│           └── CardRenderer
│               ├── EntityCard
│               ├── ButtonCard
│               ├── GaugeCard
│               ├── MarkdownCard
│               ├── VerticalStackCard
│               ├── HorizontalStackCard
│               └── GridCard
│
└── ValidationDemo
    ├── ValidationResults
    └── ExportPanel
```

## Data Flow

### 1. Dashboard State Management

```
App (root state)
│
└── newDashboard: {
    views: [
      {
        id: 'view-1',
        title: 'Home',
        cards: [
          {
            id: 'card-1',
            type: 'entities',
            config: {
              title: 'Lights',
              entities: [{entity_id: '...', name: '...'}],
              ...
            },
            rawUnknown: {}
          },
          ...
        ]
      },
      ...
    ]
  }
```

### 2. Editor State Flow

```
DashboardEditor
├── currentViewIdx: 0
├── selectedCardIdx: 1
├── showAddCardMenu: false
│
└── onDashboardChange(newDashboard)
    └── Updates App state
        └── Re-renders with new data
```

### 3. Form Configuration Flow

```
CardFormGenerator
├── config (from currentCard.config)
│
├── onChange(newConfig)
│   └── updateCard(selectedCardIdx, {config: newConfig})
│       └── onDashboardChange(updatedDashboard)
│           └── CardPreview re-renders
│
└── Renders fields based on:
    ├── CardSchemas[cardType].fields
    └── Invokes specialized pickers:
        ├── EntityMultiPicker (for entities field)
        └── ActionBuilder (for action fields)
```

### 4. Entity Selection Flow

```
EntityMultiPicker
├── entities (from App)
├── selected ([entity_ids])
├── overrides ({entity_id: {name, icon, ...}})
│
├── onChange(newSelected, newOverrides)
│   └── Propagates to CardFormGenerator
│       └── Updates config.entities
│           └── Updates Dashboard
│
└── Rendering:
    ├── Search input → filtered entities
    ├── Domain chips → filter by domain
    ├── Selected list → current selection
    │   └── Drag handles → reorder
    │   └── Expand → inline overrides
    └── Available list → remaining entities
```

### 5. Action Building Flow

```
ActionBuilder
├── action (from config field)
├── actionType ('toggle' | 'more-info' | 'navigate' | 'call-service')
│
├── onChange(newAction)
│   └── Updates config.tap_action (or hold_action, etc)
│       └── Updates Dashboard
│
└── Service Data Editing (call-service):
    ├── Service input
    ├── Parameter list
    │   ├── Add parameter button
    │   └── Remove parameter button
    └── Common presets
        └── Quick select
```

### 6. Live Preview Flow

```
CardPreview
├── Receives: card, entities, states
│
├── CardRenderer
│   ├── Matches card.type
│   ├── Invokes specific card component
│   └── Returns JSX
│
└── Specific Card Components:
    ├── EntityCard: Displays entities + states
    ├── ButtonCard: Clickable button
    ├── GaugeCard: Circular gauge with severity colors
    ├── MarkdownCard: Markdown → HTML
    │
    └── Layout Cards (recursive):
        ├── VerticalStackCard: Renders child cards vertically
        ├── HorizontalStackCard: Renders child cards horizontally
        └── GridCard: Renders in grid layout
            └── Calls renderCard recursively for children
```

## Schema System

### Schema Definition (CardSchemas)

```javascript
{
  entities: {
    label: 'Entities',
    fields: {
      title: { type: 'string', ... },
      entities: { type: 'entities-picker', ... },
      show_header_toggle: { type: 'boolean', ... },
      ...
    }
  },
  button: { ... },
  gauge: { ... },
  markdown: { ... },
  'vertical-stack': { ... },
  'horizontal-stack': { ... },
  grid: { ... }
}
```

### Form Generation from Schema

```
getCardSchema(cardType)
└── CardFormGenerator
    ├── Iterates schema.fields
    │
    ├── For each field:
    │   ├── Determine field type
    │   ├── Render appropriate control:
    │   │   ├── string → <input type="text" />
    │   │   ├── number → <input type="number" />
    │   │   ├── boolean → <input type="checkbox" />
    │   │   ├── select → <select><option>
    │   │   ├── textarea → <textarea>
    │   │   ├── entity-picker → <select> entities
    │   │   ├── entities-picker → <EntityMultiPicker>
    │   │   ├── action → <ActionBuilder>
    │   │   └── object → <textarea> JSON
    │   │
    │   └── On change:
    │       └── onChange({...config, [field]: value})
    │
    └── Updates config in real-time
```

## Validation Pipeline

### Card Validation

```
validateCard(card)
└── schema = getCardSchema(card.type)
    └── For each required field:
        ├── Check field exists in config
        ├── Check type matches
        └── Collect errors
    └── Return { valid: boolean, errors: [] }
```

### Dashboard Validation

```
ValidationDemo
├── allCards = dashboard.views.flatMap(v => v.cards)
├── For each card:
│   └── validation = validateCard(card)
│       └── Collect results
│
└── Display:
    ├── Overview (valid/invalid count)
    ├── Per-card results with errors
    └── Statistics
```

## Data Model Serialization

### Dashboard → YAML/JSON

```
exportDashboardToJSON(dashboard)
└── {
    views: [
      {
        id, title,
        cards: [
          {
            type, ...config, ...rawUnknown
          }
        ]
      }
    ]
  }
```

### YAML/JSON → Dashboard

```
cardFromYAML(yamlObj)
├── Extract type
├── Get schema for type
├── For each field in yamlObj:
│   ├── If in schema.fields → config[field]
│   └── If not → rawUnknown[field]
│
└── Return createCard(id, type, config, rawUnknown)
```

## State Update Flow (Example)

### User adds entity to card:

```
User clicks checkbox in EntityMultiPicker
│
└── toggleEntitySelection(entityId)
    └── EntityMultiPicker.onChange(newSelected, overrides)
        └── CardFormGenerator handles it
            └── onChange({...config, entities: newEntities})
                └── DashboardEditor.updateCard(idx, {config})
                    └── Build new views array
                    └── App.setNewDashboard(updatedDashboard)
                        └── React re-renders
                            └── CardPreview updates
                                └── CardRenderer shows new entity
```

## Performance Characteristics

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Search entities | O(n) | Fuzzy search on all entities |
| Filter by domain | O(n) | Linear scan of entities |
| Validate card | O(m) | m = number of schema fields |
| Render preview | O(d) | d = card depth (for layouts) |
| Update dashboard | O(1) | Simple object spread |
| Reorder cards | O(n) | n = number of cards in view |

## Extension Points

### Add New Card Type

```
1. CardSchemas in models/dashboard.js:
   {
     mycard: {
       label: 'My Card',
       fields: { ... }
     }
   }

2. CardRenderer.jsx:
   case 'mycard':
     return <MyCardComponent card={card} ... />

3. Auto-generates form from schema
```

### Add New Field Type

```
CardFormGenerator.jsx renderFieldControl:
case 'my-picker':
  return <MyCustomPicker
    value={value}
    onChange={(v) => handleFieldChange(field, v)}
  />
```

### Add Service Preset

```
ServicePresets in models/dashboard.js:
[
  {
    label: 'My Service',
    value: { action: 'call-service', ... }
  }
]
```

## Error Handling

### Validation Errors
```
ValidationDemo
├── Shows per-card errors
├── Displays in red
└── Blocks export if invalid
```

### Import Errors
```
cardFromYAML
├── Catches unknown fields
├── Preserves in rawUnknown
└── No data loss
```

### Missing Entities
```
EntityMultiPicker
├── Filters to available entities
├── Shows search count
└── User can still configure manually
```

## Thread Safety & Async

- **No async operations** in core editor
- **All state updates synchronous**
- **Entity store** static for demo (can be connected to API)
- **localStorage** for persistence in Dashboard view

---

**Last Updated:** January 18, 2026  
**Version:** 1.0
