// MTEL Button Box Controller
const socket = io('http://localhost:3737');

let editMode = false;
let currentEditButton = null;
let draggedButton = null;
let dragOffset = { x: 0, y: 0 };
let isResizing = false;

// Button configurations with switch types
const defaultButtons = [
    // Engine Controls
    { id: 'engine-toggle', label: 'Engine', type: 'toggle-guard', keybind: 'i', x: 50, y: 50, width: 120, height: 160 },
    { id: 'engine-start', label: 'START', type: 'start-button', keybind: 's', x: 190, y: 50, width: 100, height: 120 },

    // Lighting
    { id: 'headlights', label: 'Headlights', type: 'rocker', keybind: 'l', x: 310, y: 50, width: 100, height: 80 },

    // Communication
    { id: 'push-to-talk', label: 'Push to Talk', type: 'push-ptt', keybind: 'v', x: 430, y: 50, width: 80, height: 100 },

    // Pit Controls
    { id: 'exit-pit', label: 'Exit/Return', type: 'standard', keybind: 'Escape', x: 50, y: 230, width: 100, height: 60 },
    { id: 'tearoff', label: 'Tearoff', type: 'push', keybind: 't', x: 170, y: 230, width: 80, height: 100 },
    { id: 'full-pitstop', label: 'Full Pit', type: 'standard', keybind: 'F1', x: 270, y: 230, width: 100, height: 60 },

    // Brake Bias
    { id: 'brake-bias-up', label: 'Brake +', type: 'push', keybind: ']', x: 50, y: 350, width: 80, height: 100 },
    { id: 'brake-bias-down', label: 'Brake -', type: 'push', keybind: '[', x: 150, y: 350, width: 80, height: 100 },

    // Fuel Management
    { id: 'fuel-up', label: 'Fuel +', type: 'push', keybind: '=', x: 250, y: 350, width: 70, height: 90 },
    { id: 'fuel-down', label: 'Fuel -', type: 'push', keybind: '-', x: 340, y: 350, width: 70, height: 90 },
    { id: 'fuel-5gal', label: '+5 Gal', type: 'standard', keybind: 'F5', x: 430, y: 350, width: 70, height: 50 },
    { id: 'fuel-10gal', label: '+10 Gal', type: 'standard', keybind: 'F6', x: 520, y: 350, width: 70, height: 50 },
    { id: 'fuel-15gal', label: '+15 Gal', type: 'standard', keybind: 'F7', x: 610, y: 350, width: 70, height: 50 },
    { id: 'fuel-full', label: 'Full', type: 'standard', keybind: 'F8', x: 700, y: 350, width: 70, height: 50 },

    // Tire Changes
    { id: 'tires-left', label: 'Left Tires', type: 'standard', keybind: 'F9', x: 540, y: 50, width: 100, height: 60 },
    { id: 'tires-right', label: 'Right Tires', type: 'standard', keybind: 'F10', x: 540, y: 130, width: 100, height: 60 },
    { id: 'tires-all', label: 'All Tires', type: 'standard', keybind: 'F11', x: 540, y: 210, width: 100, height: 60 }
];

const LAYOUT_VERSION = 3; // Increment this to force layout reset

// Load saved layout with version check and server sync
async function loadLayout() {
    try {
        // Try to load from server first
        const response = await fetch('/api/buttonbox/layout/default');
        const data = await response.json();

        if (data.layout && Array.isArray(data.layout)) {
            console.log('Loaded layout from server');
            console.log('Sample button dimensions from server:', data.layout.slice(0, 3).map(b => ({
                id: b.id,
                width: b.width,
                height: b.height
            })));
            // Save to localStorage as cache
            localStorage.setItem('buttonbox-layout', JSON.stringify(data.layout));
            localStorage.setItem('buttonbox-layout-version', LAYOUT_VERSION);
            return data.layout;
        }
    } catch (error) {
        console.log('Could not load from server, using localStorage:', error.message);
    }

    // Fallback to localStorage
    const saved = localStorage.getItem('buttonbox-layout');
    const savedVersion = localStorage.getItem('buttonbox-layout-version');

    // Force reset if version mismatch or no version
    if (!savedVersion || parseInt(savedVersion) < LAYOUT_VERSION) {
        console.log('Layout version mismatch, resetting to defaults');
        localStorage.setItem('buttonbox-layout-version', LAYOUT_VERSION);
        localStorage.setItem('buttonbox-layout', JSON.stringify(defaultButtons));
        // Also save to server
        saveLayoutToServer(defaultButtons);
        return JSON.parse(JSON.stringify(defaultButtons));
    }

    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(defaultButtons));
}

let buttons = [];

// Initialize buttons asynchronously
async function initButtons() {
    buttons = await loadLayout();
    init();
}

function init() {
    console.log('=== BUTTON BOX INIT ===');
    console.log('Layout Version:', LAYOUT_VERSION);
    console.log('Saved Version:', localStorage.getItem('buttonbox-layout-version'));
    console.log('Number of buttons:', buttons.length);
    console.log('Button types:', buttons.map(b => `${b.id}: ${b.type} `));

    renderButtons();
    setupSocketListeners();
    updateConnectionStatus();

    // Prevent context menu on long press (mobile) - more comprehensive
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    }, { passive: false });

    // Prevent text selection on mobile
    document.addEventListener('selectstart', (e) => {
        if (e.target.closest('.button-grid')) {
            e.preventDefault();
            return false;
        }
    });

    // Prevent default touch behaviors that interfere
    document.addEventListener('touchstart', (e) => {
        if (e.target.closest('.control-button')) {
            // Allow the button to handle it, but prevent browser defaults
            e.stopPropagation();
        }
    }, { passive: true });

    // Disable edit mode on mobile/tablet
    if (window.innerWidth < 1024) {
        const editBtn = document.getElementById('editModeBtn');
        if (editBtn) {
            editBtn.style.display = 'none';
        }
    }
}

function renderButtons() {
    console.log('=== RENDERING BUTTONS ===');
    const grid = document.getElementById('buttonGrid');
    grid.innerHTML = '';

    buttons.forEach(btn => {
        console.log(`Rendering button: ${btn.id}, type: ${btn.type} `);
        const element = createButtonElement(btn);
        grid.appendChild(element);
    });

    console.log('Buttons rendered:', grid.children.length);

    // DEBUG: Check if HTML is actually in the DOM
    setTimeout(() => {
        console.log('=== POST-RENDER CHECK ===');
        const engineToggle = document.getElementById('engine-toggle');
        const engineStart = document.getElementById('engine-start');
        const headlights = document.getElementById('headlights');

        if (engineToggle) {
            console.log('Engine Toggle HTML:', engineToggle.innerHTML.substring(0, 300));
            console.log('Engine Toggle children:', engineToggle.children.length);
        }
        if (engineStart) {
            console.log('Engine Start HTML:', engineStart.innerHTML.substring(0, 300));
            console.log('Engine Start children:', engineStart.children.length);
        }
        if (headlights) {
            console.log('Headlights HTML:', headlights.innerHTML.substring(0, 300));
            console.log('Headlights children:', headlights.children.length);
        }

        // Check if CSS is being applied
        const toggleGuard = document.querySelector('.toggle-guard');
        const startButton = document.querySelector('.start-button');
        const rockerSwitch = document.querySelector('.rocker-switch');

        console.log('Found .toggle-guard:', !!toggleGuard);
        console.log('Found .start-button:', !!startButton);
        console.log('Found .rocker-switch:', !!rockerSwitch);

        if (toggleGuard) {
            const styles = window.getComputedStyle(toggleGuard);
            console.log('Toggle guard width:', styles.width, 'height:', styles.height);
        }
    }, 500);
}

function createButtonElement(btn) {
    console.log(`Creating element for ${btn.id} with type ${btn.type} `);
    const wrapper = document.createElement('div');
    wrapper.className = 'control-button';
    wrapper.id = btn.id;
    wrapper.style.left = `${btn.x} px`;
    wrapper.style.top = `${btn.y} px`;
    // Don't set width/height on wrapper - let inner elements define size
    // Only set for standard buttons which need it
    if (btn.type === 'standard') {
        wrapper.style.width = `${btn.width} px`;
        wrapper.style.height = `${btn.height} px`;
    }
    // Set explicit size for toggle-guard to ensure visibility
    if (btn.type === 'toggle-guard') {
        wrapper.style.width = '90px';
        wrapper.style.height = '200px';
    }
    // Set explicit size for rocker switch
    if (btn.type === 'rocker') {
        wrapper.style.width = '100px';
        wrapper.style.height = '100px';
    }

    let html = '';

    switch (btn.type) {
        case 'toggle-guard':
            // Professional toggle with guard (from CodePen)
            html = `
    < div class="toggle-switch-wrapper" >
                    <div class="toggle-switch">
                        <input type="checkbox" class="guard" id="${btn.id}-guard">
                        <div class="guard-sides"></div>
                        <input type="checkbox" class="switch" id="${btn.id}-input">
                        <div class="knob"></div>
                        <div class="light"></div>
                    </div>
                </div>
                <div class="button-label">${btn.label}</div>
                <div class="button-keybind">${btn.keybind}</div>
`;
            break;

        case 'rocker':
            html = `
    < div class="rocker-switch" >
                    <input type="checkbox" id="${btn.id}-input">
                    <span class="rocker-slider"></span>
                </div>
                <div class="button-label">${btn.label}</div>
                <div class="button-keybind">${btn.keybind}</div>
`;
            break;

        case 'start-button':
            html = `
    < div class="start-button" >
                    <div class="start-button-ring"></div>
                    <div class="start-button-inner" onmousedown="handlePush('${btn.id}', true)" 
                         onmouseup="handlePush('${btn.id}', false)"
                         ontouchstart="handlePush('${btn.id}', true)" 
                         ontouchend="handlePush('${btn.id}', false)">
                        ${btn.label}
                    </div>
                </div >
    <div class="button-keybind">${btn.keybind}</div>
`;
            break;

        case 'push':
        case 'push-ptt':
            const colorClass = btn.type === 'push-ptt' ? 'ptt' : '';
            html = `
    < div class="push-button ${colorClass}" >
                    <div class="push-button-base"></div>
                    <div class="push-button-top" onmousedown="handlePush('${btn.id}', true)" 
                         onmouseup="handlePush('${btn.id}', false)"
                         ontouchstart="handlePush('${btn.id}', true)" 
                         ontouchend="handlePush('${btn.id}', false)">
                    </div>
                </div >
                <div class="button-label">${btn.label}</div>
                <div class="button-keybind">${btn.keybind}</div>
`;
            break;

        case 'standard':
            html = `
    < div class="standard-button" onclick = "handleStandardButton('${btn.id}')" >
        ${btn.label}
                </div >
    <div class="button-keybind">${btn.keybind}</div>
`;
            break;
    }

    wrapper.innerHTML = html;

    // DEBUG: Log the actual HTML being created
    if (btn.type === 'toggle-guard' || btn.type === 'start-button' || btn.type === 'rocker') {
        console.log(`HTML for ${btn.id}: `, html.substring(0, 200));
    }

    // EXTRA DEBUG for engine toggle
    if (btn.id === 'engine-toggle') {
        console.log('=== ENGINE TOGGLE DEBUG ===');
        console.log('Wrapper element:', wrapper);
        console.log('Wrapper style:', wrapper.style.cssText);
        console.log('Full HTML:', html);
        setTimeout(() => {
            const toggleGuard = wrapper.querySelector('.toggle-guard');
            if (toggleGuard) {
                console.log('Toggle guard found in wrapper');
                console.log('Toggle guard computed style:', window.getComputedStyle(toggleGuard));
                console.log('Toggle guard offsetWidth:', toggleGuard.offsetWidth);
                console.log('Toggle guard offsetHeight:', toggleGuard.offsetHeight);
            } else {
                console.error('Toggle guard NOT found in wrapper!');
            }
        }, 100);
    }

    // Add event listeners after HTML is inserted
    setTimeout(() => {
        if (btn.type === 'toggle-guard') {
            const guard = document.getElementById(`${btn.id} -guard`);
            const switchInput = document.getElementById(`${btn.id} -input`);

            // Guard checkbox controls the cover
            if (guard) {
                guard.addEventListener('change', (e) => {
                    e.stopPropagation();
                });
            }

            // Switch checkbox controls the actual toggle
            if (switchInput) {
                switchInput.addEventListener('change', () => {
                    if (guard && guard.checked) {
                        handleToggle(btn.id);
                    }
                });
            }
        }

        if (btn.type === 'rocker') {
            const input = document.getElementById(`${btn.id} -input`);
            const slider = wrapper.querySelector('.rocker-slider');

            if (input) {
                input.addEventListener('change', () => handleToggle(btn.id));
            }
            if (slider) {
                slider.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!editMode) {
                        input.checked = !input.checked;
                        handleToggle(btn.id);
                    }
                });
            }
        }
    }, 0);

    // Edit mode handlers - ENABLE FOR ALL BUTTON TYPES
    wrapper.addEventListener('mousedown', (e) => handleEditMouseDown(e, btn));
    wrapper.addEventListener('dblclick', () => openKeybindEditor(btn));

    return wrapper;
}

function toggleGuard(buttonId) {
    if (editMode) return;
    const cover = event.target;
    cover.classList.toggle('open');
}

function handleToggle(buttonId) {
    if (editMode) return;
    const input = document.getElementById(`${buttonId} -input`);
    const isOn = input.checked;

    const button = buttons.find(b => b.id === buttonId);

    socket.emit('button-command', {
        button: buttonId,
        action: isOn ? 'on' : 'off',
        keybind: button ? button.keybind : null
    });
}

function handlePush(buttonId, pressed) {
    if (editMode) return;

    const element = event.target;
    if (pressed) {
        element.classList.add('pressed');
    } else {
        element.classList.remove('pressed');
    }

    const button = buttons.find(b => b.id === buttonId);

    socket.emit('button-command', {
        button: buttonId,
        action: pressed ? 'press' : 'release',
        keybind: button ? button.keybind : null
    });
}

function handleStandardButton(buttonId) {
    if (editMode) return;

    const button = buttons.find(b => b.id === buttonId);

    socket.emit('button-command', {
        button: buttonId,
        action: 'press',
        keybind: button ? button.keybind : null
    });
}

function toggleEditMode() {
    editMode = !editMode;
    const btn = document.getElementById('editModeBtn');
    btn.classList.toggle('active');
    btn.textContent = editMode ? '✅ Done' : '✏️ Edit';

    document.querySelectorAll('.control-button').forEach(el => {
        el.classList.toggle('edit-mode', editMode);
    });
}

function handleEditMouseDown(e, btn) {
    if (!editMode) return;

    const element = document.getElementById(btn.id);
    const rect = element.getBoundingClientRect();
    const isResizeHandle = e.offsetX > rect.width - 20 && e.offsetY > rect.height - 20;

    if (isResizeHandle) {
        isResizing = true;
        draggedButton = btn;
    } else {
        draggedButton = btn;
        dragOffset.x = e.clientX - btn.x;
        dragOffset.y = e.clientY - btn.y;
    }

    e.preventDefault();
}

document.addEventListener('mousemove', (e) => {
    if (!editMode || !draggedButton) return;

    if (isResizing) {
        const newWidth = Math.max(60, e.clientX - draggedButton.x);
        const newHeight = Math.max(40, e.clientY - draggedButton.y);

        const element = document.getElementById(draggedButton.id);
        element.style.width = `${newWidth} px`;
        element.style.height = `${newHeight} px`;

        // Update button object during resize
        draggedButton.width = newWidth;
        draggedButton.height = newHeight;
    } else {
        const newX = Math.max(0, e.clientX - dragOffset.x);
        const newY = Math.max(0, e.clientY - dragOffset.y);

        draggedButton.x = newX;
        draggedButton.y = newY;

        const element = document.getElementById(draggedButton.id);
        element.style.left = `${newX} px`;
        element.style.top = `${newY} px`;
    }
});

document.addEventListener('mouseup', () => {
    if (draggedButton) {
        // Update button dimensions if resizing
        if (isResizing) {
            const element = document.getElementById(draggedButton.id);
            if (element) {
                // Get the actual rendered size
                const computedWidth = element.offsetWidth;
                const computedHeight = element.offsetHeight;

                // Update button object with new dimensions
                draggedButton.width = computedWidth;
                draggedButton.height = computedHeight;

                console.log(`Resized ${draggedButton.id}: ${computedWidth}x${computedHeight} `);
            }
        }
        saveLayout();
    }
    draggedButton = null;
    isResizing = false;
});

function openKeybindEditor(btn) {
    if (!editMode) return;

    currentEditButton = btn;
    document.getElementById('editingButtonName').textContent = `Editing: ${btn.label} `;
    document.getElementById('keybindInput').value = btn.keybind;
    document.getElementById('keybindEditor').classList.add('active');

    const input = document.getElementById('keybindInput');
    input.focus();

    // Capture key with modifiers
    input.onkeydown = (e) => {
        e.preventDefault();

        // Build keybind string with modifiers
        const modifiers = [];
        if (e.ctrlKey) modifiers.push('Ctrl');
        if (e.altKey) modifiers.push('Alt');
        if (e.shiftKey) modifiers.push('Shift');

        // Get the actual key (not the modifier keys themselves)
        let key = e.key;

        // Ignore if only modifier keys are pressed
        if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
            return;
        }

        // Format special keys
        if (key === ' ') key = 'Space';
        if (key === 'Escape') key = 'Esc';
        if (key.length === 1) key = key.toUpperCase();

        // Combine modifiers and key
        if (modifiers.length > 0) {
            input.value = modifiers.join('+') + '+' + key;
        } else {
            input.value = key;
        }
    };
}

function saveKeybind() {
    if (!currentEditButton) return;

    const newKeybind = document.getElementById('keybindInput').value;
    currentEditButton.keybind = newKeybind;

    renderButtons();
    closeKeybindEditor();
    saveLayout();
}

function closeKeybindEditor() {
    document.getElementById('keybindEditor').classList.remove('active');
    currentEditButton = null;
}

function saveLayout() {
    localStorage.setItem('buttonbox-layout', JSON.stringify(buttons));
    localStorage.setItem('buttonbox-layout-version', LAYOUT_VERSION);
    console.log('Layout saved with version', LAYOUT_VERSION);

    // Visual feedback
    const saveBtn = document.querySelector('button[onclick="saveLayout()"]');
    if (saveBtn) {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✓ Saved!';
        saveBtn.style.background = '#00ff88';
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
        }, 2000);
    }

    // Also save to server for cross-device sync
    saveLayoutToServer(buttons);
}

async function saveLayoutToServer(layoutData) {
    try {
        console.log('Saving layout to server...', layoutData.length, 'buttons');
        console.log('Sample button dimensions:', layoutData.slice(0, 3).map(b => ({
            id: b.id,
            width: b.width,
            height: b.height
        })));

        const response = await fetch('/api/buttonbox/layout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                layoutName: 'default',
                buttons: layoutData
            })
        });
        const result = await response.json();
        console.log('✓ Layout synced to server:', result.message);
    } catch (error) {
        console.error('✗ Failed to sync layout to server:', error);
    }
}

function resetLayout() {
    if (confirm('Reset to default layout? This will clear all customizations.')) {
        localStorage.removeItem('buttonbox-layout');
        localStorage.removeItem('buttonbox-layout-version');
        location.reload();
    }
}

async function syncFromServer() {
    try {
        console.log('Manually syncing from server...');
        const response = await fetch('/api/buttonbox/layout/default');
        const data = await response.json();

        if (data.layout && Array.isArray(data.layout)) {
            console.log('✓ Loaded layout from server:', data.layout.length, 'buttons');
            console.log('Sample dimensions:', data.layout.slice(0, 3).map(b => ({
                id: b.id,
                width: b.width,
                height: b.height
            })));

            buttons = data.layout;
            localStorage.setItem('buttonbox-layout', JSON.stringify(data.layout));
            localStorage.setItem('buttonbox-layout-version', LAYOUT_VERSION);

            // Re-render with new layout
            renderButtons();
            alert('✓ Layout synced from server!');
        } else {
            alert('✗ No layout found on server');
        }
    } catch (error) {
        console.error('✗ Sync failed:', error);
        alert('✗ Failed to sync from server: ' + error.message);
    }
}

// Socket and connection handlings
function setupSocketListeners() {
    socket.on('connect', () => {
        console.log('Connected to MTEL server');
        updateConnectionStatus();
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateConnectionStatus();
    });
}

function updateConnectionStatus() {
    const indicator = document.getElementById('statusIndicator');
    const text = document.getElementById('statusText');

    if (socket.connected) {
        indicator.className = 'status-indicator connected';
        text.textContent = 'Connected';
    } else {
        indicator.className = 'status-indicator disconnected';
        text.textContent = 'Disconnected';
    }
}

// Fullscreen toggle for mobile/tablet
let isFullscreen = false;
let wakeLock = null;
let wakeLockVideo = null;

async function requestWakeLock() {
    try {
        // Try native Wake Lock API first
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('✓ Screen wake lock active (native API)');

            wakeLock.addEventListener('release', () => {
                console.log('Screen wake lock released');
                if (isFullscreen && document.visibilityState === 'visible') {
                    requestWakeLock();
                }
            });
            return;
        }
    } catch (err) {
        console.warn('Native wake lock failed:', err);
    }

    // Fallback: Use hidden video trick (works on more devices)
    try {
        if (!wakeLockVideo) {
            wakeLockVideo = document.createElement('video');
            wakeLockVideo.setAttribute('playsinline', '');
            wakeLockVideo.setAttribute('muted', '');
            wakeLockVideo.style.position = 'fixed';
            wakeLockVideo.style.opacity = '0';
            wakeLockVideo.style.pointerEvents = 'none';
            wakeLockVideo.style.width = '1px';
            wakeLockVideo.style.height = '1px';

            // Create a minimal video data URL (1 second of black)
            wakeLockVideo.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAs1tZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1NSByMjkwMSA3ZDBmZjIyIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxOCAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTMgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfc2FkYXB0PTEgYl9iaWFzPTAgZGlyZWN0PTEgd2VpZ2h0Yj0xIG9wZW5fZ29wPTAgd2VpZ2h0cDIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAA';

            document.body.appendChild(wakeLockVideo);
        }

        wakeLockVideo.loop = true;
        await wakeLockVideo.play();
        console.log('✓ Screen wake lock active (video fallback)');
    } catch (err) {
        console.error('All wake lock methods failed:', err);
    }
}

// Re-request wake lock when page becomes visible
document.addEventListener('visibilitychange', () => {
    if (isFullscreen && document.visibilityState === 'visible' && !wakeLock && !wakeLockVideo) {
        requestWakeLock();
    }
});

async function releaseWakeLock() {
    if (wakeLock) {
        await wakeLock.release();
        wakeLock = null;
        console.log('Wake lock released (native)');
    }
    if (wakeLockVideo) {
        wakeLockVideo.pause();
        wakeLockVideo.remove();
        wakeLockVideo = null;
        console.log('Wake lock released (video)');
    }
}

function toggleFullscreen() {
    const elem = document.documentElement;
    const btn = document.getElementById('fullscreenBtn');

    if (!isFullscreen) {
        // Enter fullscreen
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        isFullscreen = true;
        if (btn) btn.textContent = '⛶ Exit Fullscreen';

        // Request wake lock to keep screen on
        requestWakeLock();
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        isFullscreen = false;
        if (btn) btn.textContent = '⛶ Fullscreen';

        // Release wake lock
        releaseWakeLock();
    }
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', () => {
    isFullscreen = !!document.fullscreenElement;
    const btn = document.getElementById('fullscreenBtn');
    if (btn) {
        btn.textContent = isFullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
    }
});

// Double-tap to toggle fullscreen on mobile
let lastTap = 0;
document.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
        // Double tap detected
        if (e.target.closest('.button-grid')) {
            toggleFullscreen();
        }
    }
    lastTap = currentTime;
});

document.addEventListener('DOMContentLoaded', initButtons);
