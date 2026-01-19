# Quick Start Guide - Dashboard Editor

## Getting Started

### 1. Open the Editor
Navigate to the app and click **📝 Editor** in the top navigation bar.

### 2. Add a New View
1. In the left sidebar, click **+ Add View**
2. Enter a view title (e.g., "Living Room")
3. Click **Add**
4. The new view will be selected and ready for cards

### 3. Add Your First Card
1. In the center panel, click **+ Add Card**
2. Select a card type from the menu:
   - **Entities** - Display entity states
   - **Button** - Clickable action button
   - **Gauge** - Numeric value gauge
   - **Markdown** - Text/HTML content
   - **Vertical Stack** - Cards stacked vertically
   - **Horizontal Stack** - Cards in a row
   - **Grid** - Responsive grid layout

3. The card appears in the grid and is automatically selected
4. Configure it in the right sidebar form

### 4. Configure Your Card

**For Entities Card:**
1. Enter a title (optional)
2. Click in the **Entities** field
3. Search for entities by name or ID
4. Click domain filter chips to narrow results
5. Check entities to select them
6. Drag selected entities to reorder
7. Click the expand arrow (▶) to add inline overrides:
   - Custom name
   - Icon (mdi:* format)
   - Secondary info

**For Button Card:**
1. Enter button title
2. Set icon (optional)
3. Configure tap action - choose from:
   - **Toggle** - Select entity to toggle
   - **More Info** - Open entity details
   - **Navigate** - Go to URL/page
   - **Call Service** - Use presets or custom service
4. Optional: Set hold and double-tap actions

**For Gauge Card:**
1. Select an entity with numeric value
2. Set minimum and maximum values
3. Set color severity levels (green/yellow/red)
4. Enter unit of measurement

**For Markdown Card:**
1. Enter title (optional)
2. Write markdown content:
   ```markdown
   # Header
   **Bold** text
   - List item
   ```

### 5. Live Preview
As you edit, the preview updates instantly on the right sidebar.

### 6. Reorder Cards
- Use **↑** and **↓** buttons to move cards up/down
- Cards are reorganized in real-time

### 7. Edit Existing Cards
1. Click a card in the center grid
2. Make changes in the right sidebar form
3. Preview updates automatically

### 8. Delete Cards
1. Click a card to select it
2. Click **Delete** button
3. Card is removed immediately

### 9. Rename Views
1. Click **✏️ Rename** next to view title
2. Enter new name
3. Changes take effect immediately

### 10. Test & Validate
1. Click **✓ Validation** tab at the top
2. See all cards validated
3. Review statistics:
   - Total views and cards
   - Valid vs invalid cards
   - Any validation errors

### 11. Export Your Dashboard
1. Go to **✓ Validation** tab
2. Choose export format: **JSON** or **YAML**
3. View exported data
4. Click **Copy to Clipboard** to copy

## Tips & Tricks

### Entity Selection
- **Search:** Type entity ID or friendly name
- **Domain Filter:** Click chips like "light", "switch" to filter
- **Reorder:** Drag selected entities by the ≡ handle
- **Override Names:** Click expand (▶) to customize display name

### Action Building
- **Presets:** Click "Common Services" for quick presets
- **Custom Services:** Type in format `domain.service`
- **Parameters:** Add/remove service parameters dynamically
- **JSON Values:** Supports JSON parsing for complex values

### Card Layouts
- **Vertical Stack:** Best for column layout (temperature + humidity)
- **Horizontal Stack:** Best for row layout (buttons side-by-side)
- **Grid:** Best for uniform 2-4 column grids

### Markdown Tips
```markdown
# H1 Title
## H2 Subtitle
**Bold text**
*Italic text*
- List item 1
- List item 2
```

### Service Examples
- Light toggle: `light.toggle`
- Switch on: `switch.turn_on`
- Climate temp: `climate.set_temperature` + `{temperature: 22}`
- Scene activate: `scene.turn_on`

## Common Workflows

### Create Climate Control Dashboard
1. Add view "Climate"
2. Add **Vertical Stack** card
3. Inside, add **Entities** card with thermostats
4. Add two **Gauge** cards side-by-side for temp/humidity
5. Add **Button** cards for preset scenes

### Create Light Control Dashboard
1. Add view "Lights"
2. Add **Entities** card with all lights
3. Add **Button** card "All Lights Off"
   - Action: Call Service `light.turn_off`
4. Add buttons for scene presets

### Create Status Dashboard
1. Add view "Status"
2. Add multiple **Gauge** cards for key metrics
3. Add **Markdown** card with instructions
4. Add **Entities** card for binary sensors (doors, motion)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Enter | Submit form/add entity |
| Escape | Cancel input |
| ↑/↓ | Reorder cards (when buttons available) |

## Troubleshooting

**Card not showing in preview?**
- Check validation tab for errors
- Ensure all required fields are filled
- Verify entity IDs are correct

**Entity not found?**
- Check entity domain (light, switch, sensor, etc.)
- Try searching by friendly name
- Verify entity exists in entity store

**Action not working?**
- Check service format: `domain.service`
- Ensure service parameters are valid JSON
- Test service name in validation tab

**Entity appears twice?**
- Likely selected with overrides
- Check "Selected" section - may need to remove

## Learning Resources

See **DASHBOARD_EDITOR_README.md** for:
- Complete feature documentation
- Data model structure
- API reference
- Extension guide
- Architecture overview

## Support

For issues or feature requests, check:
1. ValidationDemo (✓ Validation tab) for debugging
2. Browser console for error messages
3. Mock data examples in mockData.js
