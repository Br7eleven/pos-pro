import { ipcMain } from 'electron'
import * as db from '../db/customers'

ipcMain.handle('db:customers:list', (_e, { search } = {}) => db.listCustomers(search))
ipcMain.handle('db:customers:get', (_e, { id }) => db.getCustomer(id))
ipcMain.handle('db:customers:getByPhone', (_e, { phone }) => db.getCustomerByPhone(phone))
ipcMain.handle('db:customers:create', (_e, data) => db.createCustomer(data))
ipcMain.handle('db:customers:update', (_e, { id, ...data }) => db.updateCustomer(id, data))
ipcMain.handle('db:customers:addPoints', (_e, { id, points }) => db.addLoyaltyPoints(id, points))
