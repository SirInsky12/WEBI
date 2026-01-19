# Dashboard Editor - Visual Guide

## Editor Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ioBroker Viewer  [Dashboard]  [📝 Editor]  [✓ Validation]       🟢 Connected │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────────────────┬──────────────────────────────────┐
│              │                          │                                  │
│ LEFT SIDEBAR │     CENTER PANEL         │      RIGHT SIDEBAR               │
│   (250px)    │         (1fr)            │        (400px)                   │
│              │                          │                                  │
├──────────────┼──────────────────────────┼──────────────────────────────────┤
│              │                          │                                  │
│ Views        │ Cards Grid (2 columns)   │ Card Form                        │
│              │                          │                                  │
│ [Home]       │ ┌──────────────┐         │ ┌──────────────────────────────┐ │
│ [Climate]    │ │ Lights       │ [↑]     │ │ Entities                   │ │
│              │ │ (Title)      │ [↓] [×] │ │ Display one or more...     │ │
│ + Add View   │ │              │         │ │                            │ │
│              │ └──────────────┘         │ │ Entities:                  │ │
│              │ ┌──────────────┐         │ │ [light.living_room]  [↑]   │ │
│              │ │ All Off      │ [↑]     │ │ [light.bedroom]      [↓]   │ │
│              │ │ (Button)     │ [↓] [×] │ │ [light.kitchen]      [×]   │ │
│              │ │              │         │ │                            │ │
│              │ └──────────────┘         │ │ [Search] [light] [switch] │ │
│              │ ┌──────────────┐         │ │ ☑ light.living_room      │ │
│              │ │ + Add Card   │         │ │ ☑ light.bedroom          │ │
│              │ ├──────┬───────┤         │ │ ☐ light.kitchen          │ │
│              │ │Entit │Button │         │ │                            │ │
│              │ │Gauge │Markdn │         │ └──────────────────────────────┘ │
│              │ │ │ Vert │ Horiz │         │                                  │
│              │ │Grid│Stack│Stack│         │ Live Preview:                    │
│              │ └──────┴───────┘         │ ┌──────────────────────────────┐ │
│              │                          │ │ Lights                       │ │
│              │                          │ │ ─────────────────────────── │ │
│              │                          │ │                            │ │
│              │                          │ │ ┌──────────────────────┐   │ │
│              │                          │ │ │ Living Room    [on]  │   │ │
│              │                          │ │ │ light.living_room    │   │ │
│              │                          │ │ └──────────────────────┘   │ │
│              │                          │ │ ┌──────────────────────┐   │ │
│              │                          │ │ │ Bedroom        [off] │   │ │
│              │                          │ │ │ light.bedroom        │   │ │
│              │                          │ │ └──────────────────────┘   │ │
│              │                          │ └──────────────────────────────┘ │
│              │                          │                                  │
└──────────────┴──────────────────────────┴──────────────────────────────────┘
```

## Card Types Reference

### 1. Entities Card
```
┌─ Entities ────────────────────────┐
│ Title: "Lights"                   │
│ Entities:                         │
│  ☑ light.living_room → [on]       │
│  ☑ light.bedroom      → [off]     │
│  ☑ light.kitchen      → [on]      │
│ Show header toggle: ✓             │
│ Theme: Light                      │
└───────────────────────────────────┘
```

### 2. Button Card
```
┌─ Button ──────────────────────────┐
│                                   │
│      [💡 All Lights Off]          │
│                                   │
│ Title: "All Lights Off"           │
│ Icon: mdi:lightbulb-off           │
│ Color: warning                    │
│ Tap Action: call-service          │
│  - Service: light.turn_off        │
└───────────────────────────────────┘
```

### 3. Gauge Card
```
┌─ Gauge (Temperature) ─────────────┐
│                                   │
│    Living Room Temperature        │
│              ╭─────╮              │
│            ╱         ╲            │
│          │    21.5°C  │           │
│            ╲         ╱            │
│              ╰─────╯              │
│        [green: 18, yellow: 24]   │
│ Entity: sensor.temperature        │
│ Min: 10  Max: 30                  │
└───────────────────────────────────┘
```

### 4. Markdown Card
```
┌─ Markdown ────────────────────────┐
│ Welcome                           │
│ ─────────────────────────────     │
│                                   │
│ # Hello Dashboard                 │
│                                   │
│ **Controls:**                     │
│ - Lights: Main floor              │
│ - Climate: All zones              │
│ - Sensors: Environment            │
└───────────────────────────────────┘
```

### 5. Vertical Stack
```
┌─ Vertical Stack ──────────────────┐
│ ┌─────────────────────────────┐   │
│ │   Entities (Lights)         │   │
│ │   living_room, bedroom      │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │   Button (All Off)          │   │
│ │   [Turn Off All Lights]     │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │   Markdown (Instructions)   │   │
│ │   Click button to turn off  │   │
│ └─────────────────────────────┘   │
└───────────────────────────────────┘
```

### 6. Horizontal Stack
```
┌─ Horizontal Stack ───────────────┐
│ ┌──────────┐  ┌──────────┐       │
│ │  Temp    │  │ Humidity │       │
│ │   21°C   │  │   45%    │       │
│ │ [Gauge]  │  │ [Gauge]  │       │
│ └──────────┘  └──────────┘       │
└───────────────────────────────────┘
```

### 7. Grid
```
┌─ Grid (2 columns) ───────────────┐
│ ┌──────────┐  ┌──────────┐       │
│ │ Temp     │  │ Humidity │       │
│ │ [Gauge]  │  │ [Gauge]  │       │
│ └──────────┘  └──────────┘       │
│ ┌──────────┐  ┌──────────┐       │
│ │ Bedroom  │  │ Kitchen  │       │
│ │ Temp     │  │ Temp     │       │
│ │ [Gauge]  │  │ [Gauge]  │       │
│ └──────────┘  └──────────┘       │
└───────────────────────────────────┘
```

## Entity Picker Workflow

### Step 1: Search
```
Search: "living"
Domain Filters: [light] [switch] [sensor]

Results (3):
  ☐ light.living_room (on)
  ☐ sensor.temperature_living_room (21.5)
  ☐ switch.living_room_outlet (off)
```

### Step 2: Select & Drag
```
Selected (2):                Available (19):
  ≡ light.living_room  [↑]   ☐ light.kitchen
  ≡ sensor.temperature [↓]   ☐ sensor.humidity
    [×]                      ☐ switch.coffee
                             ...
```

### Step 3: Override
```
light.living_room:
  Custom Name: [Living Room Light]
  Icon: [mdi:lightbulb]
  Secondary Info: [last-changed]
  
  [Collapse]
```

## Action Builder Workflow

### Step 1: Choose Action
```
Action Type: [call-service▼]
  - toggle
  - more-info
  - navigate
  - call-service
```

### Step 2: Configure
```
Service: [light.turn_on]

Common Services:
  [Light: Turn On] [Light: Toggle]
  [Switch: Turn On] [Climate: Set Temp]
  
Service Data:
  brightness | 255      [×]
  color_temp | 366      [×]
  
  [+ Add Parameter]
```

### Step 3: Result
```
{
  "action": "call-service",
  "service": "light.turn_on",
  "service_data": {
    "brightness": 255,
    "color_temp": 366
  }
}
```

## Form Field Types

```
Text Input:
  Label: [Some text...________________]

Number Input:
  Label: [100] (min:0 max:255)

Checkbox:
  ☑ Enable this option

Select Dropdown:
  [Choose option▼]
  - Option 1
  - Option 2
  - Option 3

Text Area:
  ┌─────────────────────────┐
  │ Multi-line text         │
  │ content here...         │
  │                         │
  └─────────────────────────┘

Entity Picker:
  [Select entity...▼]
  - light.living_room
  - light.bedroom
  - light.kitchen

Entities Picker:
  [EntityMultiPicker Component]
  (shown above)

Action Picker:
  [ActionBuilder Component]
  (shown above)

JSON Editor:
  ┌─────────────────────────┐
  │ {                       │
  │   "key": "value",       │
  │   "number": 42          │
  │ }                       │
  └─────────────────────────┘
```

## State Flow Example

### User adds light.bedroom to entities card:

```
1. User sees available list:
   ☐ light.bedroom (off)

2. User clicks checkbox:
   ☑ light.bedroom

3. Entity appears in selected list:
   ≡ light.bedroom [×]

4. Form updates:
   entities: [{entity_id: 'light.bedroom'}]

5. Config in memory:
   {
     title: 'Lights',
     entities: [
       {entity_id: 'light.living_room'},
       {entity_id: 'light.bedroom'}
     ]
   }

6. Card updates in preview:
   ┌─ Lights ──────────────┐
   │ light.living_room [on] │
   │ light.bedroom    [off] │
   └───────────────────────┘

7. Dashboard state updates:
   views[0].cards[0].config = {...}

8. onDashboardChange callback:
   App.setNewDashboard(updatedDashboard)

9. React re-renders:
   - Form stays same (editing same card)
   - Preview updates (new entities)
   - Card grid updates (shows updated title)
```

## Common Tasks

### Add Light Control Dashboard
```
1. Create view "Lights"
2. Add Entities card
   - Title: "Light Status"
   - Add light.living_room, light.bedroom, light.kitchen
3. Add Button card
   - Title: "All Off"
   - Action: call-service light.turn_off
4. Add Button card
   - Title: "All On"
   - Action: call-service light.turn_on
5. Preview shows all controls
6. Validate - no errors
7. Export as JSON/YAML
```

### Add Climate Control Dashboard
```
1. Create view "Climate"
2. Add Horizontal Stack
   - Add Gauge: temperature (min:10, max:30)
   - Add Gauge: humidity (min:0, max:100)
3. Add Entities card
   - Title: "Thermostats"
   - Add climate.living_room, climate.bedroom
4. Add Markdown card
   - Content: Instructions for users
5. Preview shows all data
6. Validate - check if required fields exist
7. Export for import to Home Assistant
```

### Validate Before Export
```
✓ Validation Dashboard
  
Cards Validated (5):
  ✓ Lights (entities)
  ✓ All Off (button)
  ✓ Temperature (gauge)
  ✓ Instructions (markdown)
  ✓ Climate Stack (vertical-stack)

Statistics:
  Views: 1
  Cards: 5
  Valid: 5 ✓
  Invalid: 0

Export as [JSON] [YAML]

[Textarea with JSON/YAML output]
[Copy to Clipboard]
```

## Tips & Tricks

### Keyboard Shortcuts
- **Enter** - Confirm/Add
- **Escape** - Cancel/Close
- **Tab** - Next field
- **Shift+Tab** - Previous field

### Visual Cues
- 🔵 Blue = Selected/Active
- 🟢 Green = Valid/Success
- 🔴 Red = Error/Invalid
- 🟡 Yellow = Warning
- ⚫ Gray = Disabled/Empty

### Entity Icons
- light.*  → 💡
- switch.* → 🔌
- climate.* → 🌡️
- sensor.* → 📊
- binary_sensor.* → ⚠️
- media_player.* → 🎬

### Performance Tips
- Use Entities card for multiple items
- Use Grid for responsive layouts
- Drag reorder instead of delete/recreate
- Validate before exporting
- Keep JSON values valid

---

**Navigation Tip:** Use the three tabs at the top to switch between:
- Dashboard: View/edit ioBroker data
- Editor: Build new dashboard
- Validation: Test & export

Enjoy building dashboards! 🚀
