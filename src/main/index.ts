import { app, BrowserWindow, shell, protocol, net } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getDb, closeDb } from './db/connection'

import './ipc/products'
import './ipc/transactions'
import './ipc/staff'
import './ipc/customers'
import './ipc/reports'
import './ipc/settings'
import './ipc/printing'
import './ipc/audit'
import './ipc/backup'

protocol.registerSchemesAsPrivileged([
  { scheme: 'product-image', privileges: { secure: true, supportFetchAPI: true } }
])

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    frame: true,
    autoHideMenuBar: true,
    title: 'Nurture POS Pro',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.nurture.pos')
  optimizer.watchWindowShortcuts

  protocol.handle('product-image', (request) => {
    const filePath = decodeURIComponent(request.url.replace('product-image:///', '').replace('product-image://', ''))
    return net.fetch(pathToFileURL(filePath).toString())
  })

  getDb()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDb()
  if (process.platform !== 'darwin') app.quit()
})
