import { ipcMain } from 'electron'
import * as db from '../db/transactions'

ipcMain.handle('db:transactions:create', (_e, input) => db.createTransaction(input))
ipcMain.handle('db:transactions:get', (_e, { id }) => db.getTransactionWithItems(id))
ipcMain.handle('db:transactions:list', (_e, filters) => db.listTransactions(filters))
ipcMain.handle('db:transactions:void', (_e, { id, reason }) => db.voidTransaction(id, reason))
