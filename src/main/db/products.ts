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
  const result = db.prepare(`
    INSERT INTO products (barcode, name, description, category_id, price, cost_price, stock_quantity, low_stock_alert, image_path)
    VALUES (@barcode, @name, @description, @category_id, @price, @cost_price, @stock_quantity, @low_stock_alert, @image_path)
  `).run(input)
  return getProduct(result.lastInsertRowid as number)!
}

export function updateProduct(id: number, input: Partial<ProductInput>): Product {
  const db = getDb()
  const fields = Object.keys(input).map(k => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE products SET ${fields}, updated_at = unixepoch() WHERE id = @id`).run({ ...input, id })
  return getProduct(id)!
}

export function adjustStock(id: number, delta: number): Product {
  const db = getDb()
  db.prepare('UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = unixepoch() WHERE id = ?').run(delta, id)
  return getProduct(id)!
}

export function listCategories(): Category[] {
  return getDb().prepare('SELECT * FROM categories ORDER BY name').all() as Category[]
}

export function createCategory(name: string, color: string): Category {
  const db = getDb()
  const result = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)').run(name, color)
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid) as Category
}
