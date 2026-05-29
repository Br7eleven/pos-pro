import { ipcMain } from 'electron'
import * as db from '../db/products'

ipcMain.handle('db:products:list', (_e, filters) => db.listProducts(filters))
ipcMain.handle('db:products:get', (_e, { id }) => db.getProduct(id))
ipcMain.handle('db:products:getByBarcode', (_e, { barcode }) => db.getProductByBarcode(barcode))
ipcMain.handle('db:products:create', (_e, input) => db.createProduct(input))
ipcMain.handle('db:products:update', (_e, { id, ...input }) => db.updateProduct(id, input))
ipcMain.handle('db:products:adjustStock', (_e, { id, delta }) => db.adjustStock(id, delta))
ipcMain.handle('db:categories:list', () => db.listCategories())
ipcMain.handle('db:categories:create', (_e, { name, color }) => db.createCategory(name, color))
