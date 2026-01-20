import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { setupIPCHandlers } from './ipc-handlers'
import { BrowserManager } from './utils/browser-manager'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Remove electron security warnings only in development mode
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
let win: BrowserWindow | null = null
const preload = join(__dirname, 'preload.js')
const distPath = join(__dirname, '../.output/public')

async function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      // Sandbox disabled to allow ESM preload scripts (nuxt-electron limitation)
      // Security: contextIsolation + nodeIntegration:false still provide strong protection
      sandbox: false,
    },
  })

  if (app.isPackaged) {
    win.loadFile(join(distPath, 'index.html'))
  } else {
    // In development, try VITE_DEV_SERVER_URL first, then fallback to localhost:3000
    const url = 'http://localhost:3000'
    win.loadURL(url).catch(err => {
      console.error('Failed to load URL:', err)
    })
    win.webContents.openDevTools()
  }

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:'))
      shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  // Set up IPC handlers (migrations run automatically in lib/db/index.ts)
  setupIPCHandlers()

  // Check if browser is installed on first run
  const browserManager = new BrowserManager()
  const isBrowserInstalled = browserManager.isBrowserInstalled()


  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
