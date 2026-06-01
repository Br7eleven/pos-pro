import { useEffect, useState } from 'react'
import { DollarSign, ShoppingBag, RotateCcw, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../lib/api'
import { useSettingsStore } from '../stores/settings.store'
import { formatPrice, todayUnix, formatDate } from '../lib/formatters'
import styles from './Reports.module.css'

type Report = {
  tx_count: number
  revenue: number
  returns: number
  avg_transaction: number
  daily: { day: number; revenue: number; tx_count: number }[]
  topProducts: { product_name: string; qty: number; revenue: number }[]
}

type AuditRow = {
  id: number
  user_name: string | null
  action: string
  entity_type: string | null
  entity_id: number | null
  new_value: string | null
  created_at: number
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Login',
  LOGIN_FAILED: 'Login Failed',
  STAFF_CREATED: 'Staff Created',
  STAFF_UPDATED: 'Staff Updated',
  SALE_CREATED: 'Sale Created',
  SALE_VOIDED: 'Sale Voided',
  SETTINGS_CHANGED: 'Settings Changed',
}

function formatAction(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function formatAuditTime(ts: number): string {
  const d = new Date(ts * 1000)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function Reports() {
  const symbol = useSettingsStore(s => s.settings.currency_symbol)
  const [report, setReport] = useState<Report | null>(null)
  const [auditLog, setAuditLog] = useState<AuditRow[]>([])

  const today = todayUnix()
  const weekAgo = today - 7 * 86400

  useEffect(() => {
    api.reports.range(weekAgo, today + 86400).then(r => setReport(r as Report))
    api.audit.list({ limit: 100 }).then(setAuditLog)
  }, [])

  const chartData = report?.daily.map(d => ({ date: formatDate(d.day), revenue: +(d.revenue / 100).toFixed(2) })) ?? []

  const stats = [
    { label: 'Revenue', value: formatPrice(report?.revenue ?? 0, symbol), icon: DollarSign, color: 'var(--color-primary)', bg: 'var(--color-primary-subtle)' },
    { label: 'Transactions', value: String(report?.tx_count ?? 0), icon: ShoppingBag, color: 'var(--color-secondary)', bg: 'var(--color-secondary-subtle)' },
    { label: 'Returns', value: formatPrice(report?.returns ?? 0, symbol), icon: RotateCcw, color: 'var(--color-error)', bg: 'var(--color-error-subtle)' },
    { label: 'Avg. Sale', value: formatPrice(Math.round(report?.avg_transaction ?? 0), symbol), icon: BarChart3, color: '#7c3aed', bg: 'rgba(124,58,237,0.10)' }
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Reports</h1>
        <span className={styles.rangePill}>Last 7 Days</span>
      </div>

      <div className={styles.stats}>
        {stats.map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: s.bg }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statValue}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Daily Revenue</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--color-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-outline-variant)', borderRadius: 8, color: 'var(--color-on-surface)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              cursor={{ fill: 'rgba(125, 195, 74, 0.08)' }}
            />
            <Bar dataKey="revenue" fill="#7dc34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Top Products</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Product</th>
              <th className={styles.th}>Qty</th>
              <th className={styles.th}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {(report?.topProducts ?? []).map((p, i) => (
              <tr key={i}>
                <td className={`${styles.td} ${styles.tdName}`}>{p.product_name}</td>
                <td className={`${styles.td} ${styles.tdQty}`}>{p.qty}</td>
                <td className={`${styles.td} ${styles.tdRevenue}`}>{formatPrice(p.revenue, symbol)}</td>
              </tr>
            ))}
            {(report?.topProducts ?? []).length === 0 && (
              <tr><td colSpan={3} className={`${styles.td} ${styles.empty}`}>No data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Audit Log</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Time</th>
              <th className={styles.th}>User</th>
              <th className={styles.th}>Action</th>
              <th className={styles.th}>Entity</th>
              <th className={styles.th}>Details</th>
            </tr>
          </thead>
          <tbody>
            {auditLog.map(row => (
              <tr key={row.id}>
                <td className={`${styles.td} ${styles.tdQty}`}>{formatAuditTime(row.created_at)}</td>
                <td className={styles.td}>{row.user_name ?? '—'}</td>
                <td className={`${styles.td} ${styles.tdName}`}>{formatAction(row.action)}</td>
                <td className={styles.td}>
                  {row.entity_type ? `${row.entity_type}${row.entity_id != null ? ` #${row.entity_id}` : ''}` : '—'}
                </td>
                <td className={`${styles.td} ${styles.tdQty}`} style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.new_value ?? '—'}
                </td>
              </tr>
            ))}
            {auditLog.length === 0 && (
              <tr><td colSpan={5} className={`${styles.td} ${styles.empty}`}>No audit entries yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
