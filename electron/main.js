import { app, BrowserWindow, globalShortcut, screen, ipcMain, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';
const WINDOW_WIDTH = 1000;

// Set up native file storage since third-party wrapper is behaving unreliably
let storePath;
const loadStore = () => {
  try {
    if (fs.existsSync(storePath)) return JSON.parse(fs.readFileSync(storePath, 'utf8'));
  } catch (e) {
    console.error("Store read error:", e);
  }
  return {};
};
const getFromStore = (key) => loadStore()[key];
const saveToStore = (key, val) => {
  const data = loadStore();
  data[key] = val;
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
};

/**
 * Creates the frameless, always-on-top sidebar window pinned to the right.
 * @returns {BrowserWindow}
 */
function createWindow() {
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: screenHeight,
    x: screenWidth - WINDOW_WIDTH,
    y: 0,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  return win;
}

app.whenReady().then(async () => {
  // Use a completely native file-system approach inside the standard userData directory
  storePath = path.join(app.getPath('userData'), 'local-settings.json');

  // IPC handlers for custom unified storage mechanism
  ipcMain.handle('store:get', (event, key) => getFromStore(key));
  ipcMain.handle('store:set', (event, key, val) => saveToStore(key, val));
  ipcMain.handle('store:clearSession', async (event, partitionId) => {
    try {
      const ses = session.fromPartition(`persist:${partitionId}`);
      await ses.clearStorageData();
    } catch (e) {
      console.error("Failed to clear session:", e);
    }
  });

  let win = createWindow();

  // Auto-hide when losing focus (clicks outside the window)
  win.on('blur', () => {
    // Prevent hiding in dev if DevTools is just opened
    if (isDev && win.webContents.isDevToolsOpened()) return;
    // Don't auto-hide if pinned mode is enabled
    if (getFromStore('isPinned')) return;
    
    win.hide();
  });

  // Ctrl+Shift+Space → toggle window visibility
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (!win || win.isDestroyed()) {
      win = createWindow();
      return;
    }
    // If visible AND currently has focus, hide it. 
    // Otherwise (if hidden or visible but lost focus), show and grab focus.
    if (win.isVisible() && win.isFocused()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      win = createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Keep alive in background so shortcut can re-open the window
  if (process.platform !== 'darwin') {
    // intentionally do not call app.quit()
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
