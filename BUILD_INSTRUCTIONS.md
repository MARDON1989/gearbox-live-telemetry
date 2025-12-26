# MTEL Installer Build Instructions

## IMPORTANT: Build Process

The MTEL installer **MUST** be built using `build_installer.bat` to include all dependencies.

### Step 1: Run Build Script

```cmd
build_installer.bat
```

This will:
1. Install backend node_modules
2. Install desktop node_modules  
3. Install Python packages to agent/lib
4. Build installer with Inno Setup

### Step 2: Installer Output

The installer will be created at:
```
MTEL/installer/MTEL-Setup-2.0.0.exe (~60MB)
```

## What Gets Included

The installer includes:
- ✅ `backend/node_modules/` (~30MB)
- ✅ `desktop/node_modules/` (~15MB)
- ✅ `agent/lib/` with irsdk, socketio, pyautogui (~5MB)
- ✅ All MTEL source code (~10MB)

## DO NOT Compile Manually

❌ **DO NOT** run Inno Setup directly on `installer.iss`  
❌ **DO NOT** use "Compile" button in Inno Setup IDE

This will create an installer **without dependencies** and it will fail!

## Always Use build_installer.bat

✅ **ALWAYS** run `build_installer.bat`  
✅ This ensures all dependencies are installed first  
✅ Then compiles the installer with everything included

## Verification

After building, check that these exist:
- `backend/node_modules/` (should have hundreds of packages)
- `desktop/node_modules/` (should have electron and dependencies)
- `agent/lib/` (should have irsdk, socketio, pyautogui folders)

If any are missing, the installer will fail!

## Common Issues

**"Module not found" errors after installation:**
- Cause: Installer was built without running build_installer.bat
- Solution: Delete installer, run build_installer.bat again

**Installer is only ~10MB:**
- Cause: node_modules not included
- Solution: Run build_installer.bat (installer should be ~60MB)

## Summary

**Correct process:**
```cmd
build_installer.bat
```

**Incorrect process:**
```cmd
ISCC.exe installer.iss  ❌ Missing dependencies!
```
