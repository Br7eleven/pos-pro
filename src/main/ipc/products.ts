import { ipcMain, dialog, app } from 'electron'
import { copyFileSync, mkdirSync } from 'fs'
import { join, basename, extname } from 'path'
import { z } from 'zod'
import * as db from '../db/products'

const ListFiltersSchema = z.object({
  categoryId: z.number().int().optional(),
  search: z.string().optional(),
  activeOnly: z.boolean().optional(),
}).optional()

const IdSchema = z.object({ id: z.number().int().positive() })

const BarcodeSchema = z.object({ barcode: z.string().min(1) })

const ProductInputSchema = z.object({
  barcode: z.string().optional(),
  name: z.string().min(1),
  price: z.number().int().positive(),
  cost_price: z.number().int().nonnegative().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  low_stock_alert: z.number().int().nonnegative().optional(),
  category_id: z.number().int().positive().optional(),
  description: z.string().optional(),
  image_path: z.string().optional(),
})

const ProductUpdateSchema = z.object({
  id: z.number().int().positive(),
}).and(ProductInputSchema.partial())

const AdjustStockSchema = z.object({
  id: z.number().int().positive(),
  delta: z.number().int().refine(
    (v) => Math.abs(v) <= 9999,
    { message: 'delta must be between -9999 and 9999' }
  ),
  reason: z.string().optional(),
  userId: z.number().int().positive().optional(),
  userName: z.string().optional(),
})

const CategoryCreateSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
})

ipcMain.handle('db:products:list', async (_e, payload) => {
  try {
    const filters = ListFiltersSchema.parse(payload)
    return db.listProducts(filters)
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('db:products:get', async (_e, payload) => {
  try {
    const { id } = IdSchema.parse(payload)
    return db.getProduct(id)
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('db:products:getByBarcode', async (_e, payload) => {
  try {
    const { barcode } = BarcodeSchema.parse(payload)
    return db.getProductByBarcode(barcode)
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('db:products:create', async (_e, payload) => {
  try {
    const input = ProductInputSchema.parse(payload)
    return db.createProduct(input)
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('db:products:update', async (_e, payload) => {
  try {
    const { id, ...input } = ProductUpdateSchema.parse(payload)
    return db.updateProduct(id, input)
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('db:products:adjustStock', async (_e, payload) => {
  try {
    const { id, delta, reason, userId, userName } = AdjustStockSchema.parse(payload)
    return db.adjustStock(id, delta, reason ?? 'Manual adjustment', userId, userName)
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('db:stock:movements', async (_e, payload) => {
  try {
    const productId = (payload as { productId?: number } | undefined)?.productId
    return db.listStockMovements(productId)
  } catch (err) {
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('db:categories:list', () => db.listCategories())

ipcMain.handle('db:categories:create', async (_e, payload) => {
  try {
    const { name, color } = CategoryCreateSchema.parse(payload)
    return db.createCategory(name, color)
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('dialog:selectImage', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const src = result.filePaths[0]
  const imagesDir = join(app.getPath('userData'), 'product-images')
  mkdirSync(imagesDir, { recursive: true })
  const dest = join(imagesDir, `${Date.now()}${extname(basename(src))}`)
  copyFileSync(src, dest)
  return dest
})
