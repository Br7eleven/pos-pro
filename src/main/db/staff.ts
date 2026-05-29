import { getDb } from './connection'
import bcrypt from 'bcryptjs'
import type { Staff } from '../../renderer/types'

export function authenticate(pin: string): Omit<Staff, 'pin_hash'> | null {
  const db = getDb()
  const staff = db.prepare('SELECT * FROM staff WHERE active = 1').all() as Staff[]
  for (const s of staff) {
    if (bcrypt.compareSync(pin, s.pin_hash)) {
      const { pin_hash: _, ...safe } = s
      return safe
    }
  }
  return null
}

export function listStaff(): Omit<Staff, 'pin_hash'>[] {
  const rows = getDb().prepare('SELECT id, name, role, active, created_at, updated_at FROM staff').all()
  return rows as Omit<Staff, 'pin_hash'>[]
}

export function createStaff(name: string, pin: string, role: 'cashier' | 'manager'): Omit<Staff, 'pin_hash'> {
  const db = getDb()
  const pinHash = bcrypt.hashSync(pin, 10)
  const result = db.prepare('INSERT INTO staff (name, pin_hash, role) VALUES (?, ?, ?)').run(name, pinHash, role)
  return db.prepare('SELECT id, name, role, active, created_at, updated_at FROM staff WHERE id = ?').get(result.lastInsertRowid) as Omit<Staff, 'pin_hash'>
}

export function updateStaff(id: number, data: { name?: string; pin?: string; role?: string; active?: number }): Omit<Staff, 'pin_hash'> {
  const db = getDb()
  const update: Record<string, string | number> = {}
  if (data.name) update.name = data.name
  if (data.pin) update.pin_hash = bcrypt.hashSync(data.pin, 10)
  if (data.role) update.role = data.role
  if (data.active !== undefined) update.active = data.active
  update.updated_at = Math.floor(Date.now() / 1000)

  const fields = Object.keys(update).map(k => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE staff SET ${fields} WHERE id = @id`).run({ ...update, id })
  return db.prepare('SELECT id, name, role, active, created_at, updated_at FROM staff WHERE id = ?').get(id) as Omit<Staff, 'pin_hash'>
}
