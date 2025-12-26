# MTEL Desktop Application Features

## Fullscreen Mode

The MTEL desktop application now supports fullscreen mode for an immersive telemetry viewing experience.

### How to Use Fullscreen

**Keyboard Shortcut:**
- Press **F11** to toggle fullscreen mode on/off
- Works at any time while the application is focused

**System Tray Menu:**
1. Right-click the MTEL icon in the system tray
2. Select "Toggle Fullscreen (F11)"
3. The window will enter/exit fullscreen mode

### Fullscreen Benefits

- **Maximum Screen Real Estate**: Use your entire screen for telemetry data
- **Distraction-Free**: Hide taskbar and window borders
- **Racing Focus**: Perfect for dedicated telemetry monitoring during races
- **Multi-Monitor**: Great for secondary monitor setups

### Tips

- Use fullscreen on a secondary monitor while racing on your primary
- Combine with moveable/resizable cards for optimal layout
- Press F11 again to exit fullscreen and return to windowed mode
- Fullscreen state is not persisted (returns to windowed on restart)

## Other Desktop Features

### System Tray Integration
- Minimize to system tray instead of closing
- Quick access via tray icon
- Right-click menu for common actions

### Window Management
- Minimize to tray on close
- Restore from tray by clicking icon
- Hide/show from tray menu

### Auto-Start (Optional)
- Can be configured to start with Windows
- Runs in background until needed

## Keyboard Shortcuts Summary

- **F11**: Toggle fullscreen mode
- **Ctrl+Shift+R**: Reset telemetry card layout (browser feature)

## Desktop vs Browser

Both versions support the same features:
- ✅ Real-time telemetry display
- ✅ Moveable/resizable cards
- ✅ MARDON PC branding
- ✅ Historical data access

Desktop-only features:
- ✅ System tray integration
- ✅ Fullscreen mode (F11)
- ✅ Native window controls
- ✅ Offline installer

Browser-only features:
- ✅ No installation required
- ✅ Cross-platform (any OS)
- ✅ Easy OBS integration

## Building the Desktop App

```bash
cd desktop
npm install
npm start          # Run in development
npm run build:win  # Build Windows installer
```

The installer will be created in `desktop/dist/`.
