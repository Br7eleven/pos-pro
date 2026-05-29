import { ipcMain } from 'electron'
import * as db from '../db/settings'

ipcMain.handle('settings:getAll', () => db.getAllSettings())
ipcMain.handle('settings:set', (_e, { key, value }) => db.setSetting(key, value))
ipcMain.handle('settings:setMany', (_e, data) => db.setManySettings(data))
