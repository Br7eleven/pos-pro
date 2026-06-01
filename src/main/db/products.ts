import { getDb } from './connection'
import type { Product, ProductInput, Category } from '../../renderer/types'

export function listProducts(filters: { categoryId?: number; search?: string; activeOnly?: boolean } = {}): Product[] {
  const db = getDb()
  let sql = `SELECT p.*, c.name AS category_name, c.color AS category_color
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE 1=1`
  const params: (string | number)[] = []

  if (filters.activeOnly !== false) { sql += ' AND p.active = 1'; }
  if (filters.categoryId) { sql += ' AND p.category_id = ?'; params.push(filters.categoryId) }
  if (filters.search) { sql += ' AND (p.name LIKE ? OR p.barcode LIKE ?)'; params.push(`%${filters.search}%`, `%${filters.search}%`) }

  sql += ' ORDER BY p.name ASC'
  return db.prepare(sql).all(...params) as Product[]
}

export function getProduct(id: number): Product | null {
  const db = getDb()
  return db.prepare(`SELECT p.*, c.name AS category_name, c.color AS category_color
    FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`).get(id) as Product | null
}

export function getProductByBarcode(barcode: string): Product | null {
  const db = getDb()
  return db.prepare(`SELECT p.*, c.name AS category_name, c.color AS category_color
    FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.barcode = ? AND p.active = 1`).get(barcode) as Product | null
}

export function createProduct(input: ProductInput): Product {
  const db = getDb()
  const data = {
    barcode: input.barcode ?? null,
    sku: input.sku ?? null,
    name: input.name,
    description: input.description ?? null,
    category_id: input.category_id ?? null,
    price: input.price,
    cost_price: input.cost_price ?? 0,
    stock_quantity: input.stock_quantity ?? 0,
    low_stock_alert: input.low_stock_alert ?? 5,
    image_path: input.image_path ?? null
  }
  const result = db.prepare(`
    INSERT INTO products (barcode, sku, name, description, category_id, price, cost_price, stock_quantity, low_stock_alert, image_path)
    VALUES (@barcode, @sku, @name, @description, @category_id, @price, @cost_price, @stock_quantity, @low_stock_alert, @image_path)
  `).run(data)
  return getProduct(result.lastInsertRowid as number)!
}

export function updateProduct(id: number, input: Partial<ProductInput>): Product {
  const db = getDb()
  const fields = Object.keys(input).map(k => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE products SET ${fields}, updated_at = unixepoch() WHERE id = @id`).run({ ...input, id })
  return getProduct(id)!
}

export function adjustStock(id: number, delta: number, reason: string, userId?: number, userName?: string): Product {
  const db = getDb()
  const current = db.prepare('SELECT stock_quantity, name FROM products WHERE id = ?').get(id) as { stock_quantity: number; name: string }
  db.prepare('UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = unixepoch() WHERE id = ?').run(delta, id)
  db.prepare('INSERT INTO stock_movements (product_id, product_name, delta, reason, user_id, user_name, before_qty, after_qty) VALUES (?,?,?,?,?,?,?,?)').run(
    id, current.name, delta, reason, userId ?? null, userName ?? null, current.stock_quantity, current.stock_quantity + delta
  )
  return getProduct(id)!
}

export function listStockMovements(productId?: number, limit = 100) {
  const db = getDb()
  if (productId) return db.prepare('SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT ?').all(productId, limit)
  return db.prepare('SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT ?').all(limit)
}

export function listCategories(): Category[] {
  return getDb().prepare('SELECT * FROM categories ORDER BY name').all() as Category[]
}

export function createCategory(name: string, color: string): Category {
  const db = getDb()
  const result = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)').run(name, color)
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid) as Category
}
