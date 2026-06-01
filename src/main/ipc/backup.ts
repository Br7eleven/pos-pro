import { ipcMain, dialog, app } from 'electron'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { getDb, closeDb } from '../db/connection'

ipcMain.handle('backup:create', async () => {
  const userData = app.getPath('userData')
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupDir = join(userData, 'backups')
  mkdirSync(backupDir, { recursive: true })
  const dest = join(backupDir, `nurture-pos-backup-${ts}.db`)
  const db = getDb()
  await db.backup(dest)
  return { path: dest, timestamp: ts }
})

ipcMain.handle('backup:list', () => {
  const backupDir = join(app.getPath('userData'), 'backups')
  if (!existsSync(backupDir)) return []
  return readdirSync(backupDir)
    .filter((f: string) => f.endsWith('.db'))
    .map((f: string) => {
      const full = join(backupDir, f)
      const stat = statSync(full)
      return { name: f, path: full, size: stat.size, created: Math.floor(stat.mtimeMs / 1000) }
    })
    .sort((a: { created: number }, b: { created: number }) => b.created - a.created)
})

ipcMain.handle('backup:selectFile', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select backup file to restore',
    filters: [{ name: 'Database', extensions: ['db'] }],
    properties: ['openFile']
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('backup:restore', async (_e, { backupPath }: { backupPath: string }) => {
  if (!existsSync(backupPath)) throw new Error('Backup file not found')
  const userData = app.getPath('userData')
  const target = join(userData, 'nurture-pos.db')
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const preBackup = join(userData, 'backups', `pre-restore-${ts}.db`)
  mkdirSync(join(userData, 'backups'), { recursive: true })
  const db = getDb()
  await db.backup(preBackup)
  closeDb()
  copyFileSync(backupPath, target)
  // Reopen connection so the app continues working
  getDb()
  return { preBackupPath: preBackup }
})
