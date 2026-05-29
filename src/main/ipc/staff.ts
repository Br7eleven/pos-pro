import { ipcMain } from 'electron'
import * as db from '../db/staff'

ipcMain.handle('staff:authenticate', (_e, { pin }) => db.authenticate(pin))
ipcMain.handle('staff:list', () => db.listStaff())
ipcMain.handle('staff:create', (_e, { name, pin, role }) => db.createStaff(name, pin, role))
ipcMain.handle('staff:update', (_e, { id, ...data }) => db.updateStaff(id, data))
