import { getDb } from './connection'

export function getDailySummary(date: number): object {
  const db = getDb()
  const dayStart = date - (date % 86400)
  const dayEnd = dayStart + 86400

  const summary = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type='sale' THEN 1 ELSE 0 END),0) as tx_count,
      COALESCE(SUM(CASE WHEN type='sale' THEN total ELSE 0 END),0) as revenue,
      COALESCE(SUM(CASE WHEN type='return' THEN total ELSE 0 END),0) as returns
    FROM transactions
    WHERE created_at >= ? AND created_at < ? AND status = 'completed'
  `).get(dayStart, dayEnd)

  const topProducts = db.prepare(`
    SELECT ti.product_name, SUM(ti.quantity) as qty, SUM(ti.line_total) as revenue
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE t.created_at >= ? AND t.created_at < ? AND t.status = 'completed'
    GROUP BY ti.product_name ORDER BY revenue DESC LIMIT 5
  `).all(dayStart, dayEnd)

  return { ...summary as object, topProducts, date: dayStart }
}

export function getRangeSummary(from: number, to: number): object {
  const db = getDb()

  const summary = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type='sale' THEN 1 ELSE 0 END),0) as tx_count,
      COALESCE(SUM(CASE WHEN type='sale' THEN total ELSE 0 END),0) as revenue,
      COALESCE(SUM(CASE WHEN type='return' THEN total ELSE 0 END),0) as returns,
      COALESCE(AVG(CASE WHEN type='sale' THEN total END),0) as avg_transaction
    FROM transactions
    WHERE created_at >= ? AND created_at <= ? AND status = 'completed'
  `).get(from, to)

  const daily = db.prepare(`
    SELECT (created_at / 86400 * 86400) as day, SUM(total) as revenue, COUNT(*) as tx_count
    FROM transactions
    WHERE created_at >= ? AND created_at <= ? AND status = 'completed' AND type = 'sale'
    GROUP BY day ORDER BY day
  `).all(from, to)

  const topProducts = db.prepare(`
    SELECT ti.product_name, ti.product_id, SUM(ti.quantity) as qty, SUM(ti.line_total) as revenue
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE t.created_at >= ? AND t.created_at <= ? AND t.status = 'completed'
    GROUP BY ti.product_id ORDER BY revenue DESC LIMIT 10
  `).all(from, to)

  const byPaymentMethod = db.prepare(`
    SELECT payment_method, COUNT(*) as count, SUM(total) as revenue
    FROM transactions
    WHERE created_at >= ? AND created_at <= ? AND status = 'completed'
    GROUP BY payment_method
  `).all(from, to)

  return { ...summary as object, daily, topProducts, byPaymentMethod }
}
