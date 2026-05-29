import { useEffect, useState } from 'react'
import { Plus, Package, DollarSign, ShoppingBag, RotateCcw, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'
import { useSettingsStore } from '../stores/settings.store'
import { formatPrice, formatDateTime, todayUnix } from '../lib/formatters'
import type { Transaction, Product } from '../types'
import styles from './Dashboard.module.css'

export function Dashboard() {
  const symbol = useSettingsStore(s => s.settings.currency_symbol)
  const navigate = useNavigate()
  const [summary, setSummary] = useState<{ tx_count: number; revenue: number; returns: number } | null>(null)
  const [recentTx, setRecentTx] = useState<Transaction[]>([])
  const [lowStock, setLowStock] = useState<Product[]>([])

  useEffect(() => {
    const today = todayUnix()
    api.reports.daily(today).then(d => setSummary(d as typeof summary))
    api.transactions.list({ from: today }).then(txs => setRecentTx(txs.slice(0, 10)))
    api.products.list({ activeOnly: true }).then(products =>
      setLowStock(products.filter(p => p.stock_quantity <= p.low_stock_alert).slice(0, 8))
    )
  }, [])

  const net = (summary?.revenue ?? 0) - (summary?.returns ?? 0)

  const stats = [
    { label: "Today's Sales", value: formatPrice(summary?.revenue ?? 0, symbol), icon: DollarSign, color: '#7dc34a', bg: 'rgba(125,195,74,0.12)' },
    { label: 'Transactions', value: String(summary?.tx_count ?? 0), icon: ShoppingBag, color: '#0891b2', bg: 'rgba(8,145,178,0.12)' },
    { label: 'Returns', value: formatPrice(summary?.returns ?? 0, symbol), icon: RotateCcw, color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
    { label: 'Net Revenue', value: formatPrice(net, symbol), icon: TrendingUp, color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' }
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.sub}>Today's overview</p>
        </div>
        <div className={styles.quickActions}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/terminal')}>
            <ShoppingBag size={14} /> New Sale
          </Button>
          <Button size="sm" onClick={() => navigate('/inventory')}>
            <Plus size={14} /> Add Product
          </Button>
        </div>
      </div>

      <div className={styles.stats}>
        {stats.map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: s.bg }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div className={styles.statBody}>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statValue}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Recent Transactions</h2>
          <table className={styles.txTable}>
            <thead>
              <tr><th>#</th><th>Time</th><th>Method</th><th>Total</th></tr>
            </thead>
            <tbody>
              {recentTx.map(tx => (
                <tr key={tx.id}>
                  <td>#{tx.id}</td>
                  <td>{formatDateTime(tx.created_at)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{tx.payment_method}</td>
                  <td>{formatPrice(tx.total, symbol)}</td>
                </tr>
              ))}
              {recentTx.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-muted)', paddingTop: 16 }}>No transactions today</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-md)' }}>
            <Package size={16} color="var(--color-warning)" />
            <h2 className={styles.cardTitle} style={{ margin: 0 }}>Low Stock</h2>
          </div>
          <div className={styles.lowStock}>
            {lowStock.map(p => (
              <div key={p.id} className={styles.lowItem}>
                <span style={{ fontWeight: 500 }}>{p.name}</span>
                <span style={{
                  color: p.stock_quantity === 0 ? 'var(--color-error)' : 'var(--color-warning)',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 600,
                  fontSize: 12
                }}>
                  {p.stock_quantity === 0 ? 'OUT' : `${p.stock_quantity} left`}
                </span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-body-sm)' }}>All stock levels OK</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
