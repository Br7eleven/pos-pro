import { ipcMain } from 'electron'
import * as db from '../db/reports'

ipcMain.handle('reports:daily', (_e, { date }) => db.getDailySummary(date))
ipcMain.handle('reports:range', (_e, { from, to }) => db.getRangeSummary(from, to))
