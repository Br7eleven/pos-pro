import { getDb } from './connection'

export interface AuditEntry {
  id: number
  user_id: number | null
  user_name: string | null
  action: string
  entity_type: string | null
  entity_id: number | null
  old_value: string | null
  new_value: string | null
  created_at: number
}

export interface AuditInput {
  userId?: number
  userName?: string
  action: string
  entityType?: string
  entityId?: number
  oldValue?: unknown
  newValue?: unknown
}

export function writeAudit(input: AuditInput): void {
  try {
    const db = getDb()
    db.prepare(`
      INSERT INTO audit_log (user_id, user_name, action, entity_type, entity_id, old_value, new_value)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.userId ?? null,
      input.userName ?? null,
      input.action,
      input.entityType ?? null,
      input.entityId ?? null,
      input.oldValue != null ? JSON.stringify(input.oldValue) : null,
      input.newValue != null ? JSON.stringify(input.newValue) : null
    )
  } catch { /* audit must never crash the main flow */ }
}

export function listAuditLog(filters: { from?: number; to?: number; action?: string; limit?: number } = {}): AuditEntry[] {
  const db = getDb()
  let sql = 'SELECT * FROM audit_log WHERE 1=1'
  const params: (string | number)[] = []
  if (filters.from) { sql += ' AND created_at >= ?'; params.push(filters.from) }
  if (filters.to)   { sql += ' AND created_at <= ?'; params.push(filters.to) }
  if (filters.action) { sql += ' AND action = ?'; params.push(filters.action) }
  sql += ` ORDER BY created_at DESC LIMIT ${filters.limit ?? 200}`
  return db.prepare(sql).all(...params) as AuditEntry[]
}
