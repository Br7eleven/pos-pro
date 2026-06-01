import { ipcMain } from 'electron'
import * as db from '../db/audit'

ipcMain.handle('audit:list', (_e, filters) => db.listAuditLog(filters ?? {}))
