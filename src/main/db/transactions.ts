import { getDb } from './connection'
import type { Transaction, TransactionInput, TransactionWithItems } from '../../renderer/types'

export function createTransaction(input: TransactionInput): TransactionWithItems {
  const db = getDb()

  const subtotal = input.items.reduce((s, i) => s + i.unitPrice * i.quantity - (i.discount ?? 0), 0)
  const discount = input.discount ?? 0
  const taxRate = parseFloat((db.prepare("SELECT value FROM settings WHERE key = 'tax_rate'").get() as { value: string })?.value ?? '0')
  const tax = Math.round((subtotal - discount) * taxRate / 100)
  const total = subtotal - discount + tax

  const tx = db.transaction(() => {
    const txResult = db.prepare(`
      INSERT INTO transactions (type, customer_id, staff_id, subtotal, discount, tax, total, payment_method, amount_tendered, change_given, notes, original_tx_id)
      VALUES (@type, @customer_id, @staff_id, @subtotal, @discount, @tax, @total, @payment_method, @amount_tendered, @change_given, @notes, @original_tx_id)
    `).run({
      type: input.type,
      customer_id: input.customerId ?? null,
      staff_id: input.staffId,
      subtotal, discount, tax, total,
      payment_method: input.paymentMethod,
      amount_tendered: input.amountTendered ?? null,
      change_given: input.amountTendered != null ? input.amountTendered - total : null,
      notes: input.notes ?? null,
      original_tx_id: (input as { originalTxId?: number }).originalTxId ?? null
    })
    const txId = txResult.lastInsertRowid as number

    for (const item of input.items) {
      const lineTotal = item.unitPrice * item.quantity - (item.discount ?? 0)
      const product = db.prepare('SELECT name FROM products WHERE id = ?').get(item.productId) as { name: string }
      db.prepare(`
        INSERT INTO transaction_items (transaction_id, product_id, product_name, unit_price, quantity, discount, line_total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(txId, item.productId, product.name, item.unitPrice, item.quantity, item.discount ?? 0, lineTotal)

      if (input.type === 'sale') {
        db.prepare('UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = unixepoch() WHERE id = ?').run(item.quantity, item.productId)
      } else {
        db.prepare('UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = unixepoch() WHERE id = ?').run(item.quantity, item.productId)
      }
    }

    return txId
  })()

  return getTransactionWithItems(tx)!
}

export function getTransactionWithItems(id: number): TransactionWithItems | null {
  const db = getDb()
  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction | null
  if (!transaction) return null
  const items = db.prepare('SELECT * FROM transaction_items WHERE transaction_id = ?').all(id)
  return { ...transaction, items } as TransactionWithItems
}

export function listTransactions(filters: { from?: number; to?: number; staffId?: number; type?: string } = {}): Transaction[] {
  const db = getDb()
  let sql = 'SELECT * FROM transactions WHERE 1=1'
  const params: (string | number)[] = []

  if (filters.from) { sql += ' AND created_at >= ?'; params.push(filters.from) }
  if (filters.to) { sql += ' AND created_at <= ?'; params.push(filters.to) }
  if (filters.staffId) { sql += ' AND staff_id = ?'; params.push(filters.staffId) }
  if (filters.type) { sql += ' AND type = ?'; params.push(filters.type) }

  sql += ' ORDER BY created_at DESC'
  return db.prepare(sql).all(...params) as Transaction[]
}

export function voidTransaction(id: number, reason: string): Transaction {
  const db = getDb()
  db.prepare("UPDATE transactions SET status = 'voided', notes = ? WHERE id = ?").run(reason, id)
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction
  const items = db.prepare('SELECT * FROM transaction_items WHERE transaction_id = ?').all(id) as { product_id: number; quantity: number }[]
  for (const item of items) {
    db.prepare('UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = unixepoch() WHERE id = ?').run(item.quantity, item.product_id)
  }
  return tx
}
