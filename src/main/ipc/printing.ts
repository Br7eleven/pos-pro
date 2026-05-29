import { ipcMain, BrowserWindow, webContents } from 'electron'

ipcMain.handle('print:getPrinters', async (e) => {
  return webContents.fromId(e.sender.id)?.getPrintersAsync() ?? []
})

ipcMain.handle('print:receipt', async (_e, { html, printerName }: { html: string; printerName?: string }) => {
  const win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false } })
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  await new Promise<void>((resolve, reject) => {
    win.webContents.print(
      { silent: true, deviceName: printerName ?? '', printBackground: true },
      (success, reason) => {
        win.close()
        success ? resolve() : reject(new Error(reason))
      }
    )
  })
})
