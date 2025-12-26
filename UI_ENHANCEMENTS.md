# MTEL UI Enhancements - Interactive Telemetry Boxes

## New Features Added

### 🎨 MARDON PC Logo Integration
- **Logo Display**: MARDON PC logo now appears in the header of both browser and desktop applications
- **Branding Update**: Changed subtitle from "Mardon Telemetry Enhanced" to "MTEL - MARDON Enhanced Telemetry"
- **Visual Enhancement**: Logo includes drop shadow for premium appearance

### 🖱️ Moveable Telemetry Boxes
All telemetry cards can now be dragged and repositioned anywhere on the screen:

- **Drag Handle**: Click and hold the card header to drag
- **Visual Feedback**: 
  - Cursor changes to "grab" when hovering over header
  - Cursor changes to "grabbing" when dragging
  - Card becomes semi-transparent while being dragged
- **Free Positioning**: Move cards to any location on screen
- **Persistent Layout**: Card positions are saved to browser localStorage
- **Auto-restore**: Positions are restored when you reload the page

### 📏 Resizable Telemetry Boxes
All telemetry cards can be resized to fit your preferences:

- **Resize Handle**: Small triangle in bottom-right corner of each card
- **Visual Feedback**:
  - Handle becomes more visible on hover
  - Cursor changes to resize diagonal arrows
- **Minimum Size**: Cards have minimum dimensions (250px width, 150px height)
- **Persistent Sizing**: Card sizes are saved to browser localStorage
- **Auto-restore**: Sizes are restored when you reload the page

### ⌨️ Keyboard Shortcuts
- **Ctrl+Shift+R**: Reset all cards to default positions and sizes
  - Confirmation dialog prevents accidental resets
  - Clears all saved positions from localStorage
  - Reloads page to apply default layout

## How to Use

### Moving a Card
1. Hover over the card header (where the title is)
2. Click and hold the left mouse button
3. Drag the card to your desired position
4. Release the mouse button
5. Position is automatically saved

### Resizing a Card
1. Hover over the bottom-right corner of the card
2. Look for the small triangular resize handle
3. Click and hold the left mouse button
4. Drag to resize the card
5. Release the mouse button
6. Size is automatically saved

### Resetting Layout
1. Press **Ctrl+Shift+R** on your keyboard
2. Click "OK" in the confirmation dialog
3. Page will reload with default layout

## Technical Implementation

### Files Modified
- **frontend/index.html**: Added logo, drag handles, resize handles, and data attributes
- **frontend/style.css**: Added logo styling, drag/resize handle styles, and interactive states
- **frontend/app.js**: Implemented drag-and-drop and resize JavaScript functionality
- **frontend/mardon-logo.png**: MARDON PC logo image
- **desktop/icon.png**: Logo for desktop application icon

### Features
- **localStorage Persistence**: Card positions and sizes saved per browser
- **Event Handling**: Mouse events for drag and resize operations
- **State Management**: Tracks dragging/resizing state
- **Boundary Constraints**: Minimum size enforcement
- **Z-index Management**: Dragged cards appear on top
- **Performance**: Efficient event listeners and state updates

## Cards That Are Moveable/Resizable

All telemetry cards support drag and resize:

1. ✅ **Live Session** - Track, car, and driver info
2. ✅ **Current Lap** - Live lap timer and speed
3. ✅ **Best Lap** - Session best lap time
4. ✅ **Fuel Management** - Fuel gauge and calculations
5. ✅ **Race Position** - Position and gaps
6. ✅ **Last 5 Laps** - Recent lap times
7. ✅ **Recent Laps** - Full lap history
8. ✅ **Connected Drivers** - Active agents

## Browser Compatibility

Works in all modern browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Desktop Application (Electron)

## Tips for Best Experience

1. **Organize Your Layout**: Arrange cards based on your racing priorities
2. **OBS Overlay**: Position cards for optimal stream layout
3. **Multi-Monitor**: Drag cards to secondary monitors
4. **Save Layouts**: Different browsers can have different layouts
5. **Reset Anytime**: Use Ctrl+Shift+R if layout gets messy

## Future Enhancements (Potential)

- Save/load multiple layout presets
- Snap-to-grid positioning
- Card minimize/maximize
- Layout export/import
- Touch support for tablets

---

**Enjoy your customizable MTEL dashboard! 🏁**
