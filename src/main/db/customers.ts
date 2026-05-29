import { getDb } from './connection'
import type { Customer } from '../../renderer/types'

export function listCustomers(search?: string): Customer[] {
  const db = getDb()
  if (search) {
    return db.prepare('SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name').all(`%${search}%`, `%${search}%`) as Customer[]
  }
  return db.prepare('SELECT * FROM customers ORDER BY name').all() as Customer[]
}

export function getCustomer(id: number): Customer | null {
  return getDb().prepare('SELECT * FROM customers WHERE id = ?').get(id) as Customer | null
}

export function getCustomerByPhone(phone: string): Customer | null {
  return getDb().prepare('SELECT * FROM customers WHERE phone = ?').get(phone) as Customer | null
}

export function createCustomer(data: { name: string; phone?: string; email?: string; notes?: string }): Customer {
  const db = getDb()
  const result = db.prepare('INSERT INTO customers (name, phone, email, notes) VALUES (@name, @phone, @email, @notes)').run({
    name: data.name, phone: data.phone ?? null, email: data.email ?? null, notes: data.notes ?? null
  })
  return getCustomer(result.lastInsertRowid as number)!
}

export function updateCustomer(id: number, data: Partial<{ name: string; phone: string; email: string; notes: string }>): Customer {
  const db = getDb()
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE customers SET ${fields}, updated_at = unixepoch() WHERE id = @id`).run({ ...data, id })
  return getCustomer(id)!
}

export function addLoyaltyPoints(id: number, points: number): Customer {
  const db = getDb()
  db.prepare('UPDATE customers SET loyalty_points = loyalty_points + ?, updated_at = unixepoch() WHERE id = ?').run(points, id)
  return getCustomer(id)!
}
