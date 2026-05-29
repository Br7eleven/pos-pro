import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, RotateCcw, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../lib/api'
import { useSettingsStore } from '../stores/settings.store'
import { formatPrice, todayUnix, formatDate } from '../lib/formatters'

type Report = {
  tx_count: number
  revenue: number
  returns: number
  avg_transaction: number
  daily: { day: number; revenue: number; tx_count: number }[]
  topProducts: { product_name: string; qty: number; revenue: number }[]
}

const page: React.CSSProperties = { padding: 'var(--space-lg)', overflow: 'auto', height: '100vh', background: 'var(--color-background)' }
const card: React.CSSProperties = { background: 'var(--color-surface)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)', boxShadow: '0 1px 3px rgba(17,24,39,0.06)' }

export function Reports() {
  const symbol = useSettingsStore(s => s.settings.currency_symbol)
  const [report, setReport] = useState<Report | null>(null)

  const today = todayUnix()
  const weekAgo = today - 7 * 86400

  useEffect(() => {
    api.reports.range(weekAgo, today + 86400).then(r => setReport(r as Report))
  }, [])

  const chartData = report?.daily.map(d => ({ date: formatDate(d.day), revenue: +(d.revenue / 100).toFixed(2) })) ?? []

  const stats = [
    { label: 'Revenue', value: formatPrice(report?.revenue ?? 0, symbol), icon: DollarSign, color: '#7dc34a' },
    { label: 'Transactions', value: String(report?.tx_count ?? 0), icon: ShoppingBag, color: '#0891b2' },
    { label: 'Returns', value: formatPrice(report?.returns ?? 0, symbol), icon: RotateCcw, color: '#dc2626' },
    { label: 'Avg. Sale', value: formatPrice(Math.round(report?.avg_transaction ?? 0), symbol), icon: BarChart3, color: '#7c3aed' }
  ]

  return (
    <div style={page}>
      <h1 style={{ fontSize: 'var(--font-size-headline-lg)', fontWeight: 700, letterSpacing: 'var(--letter-spacing-headline)', marginBottom: 'var(--space-xl)' }}>
        Reports — Last 7 Days
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)', marginBottom: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-label)', fontWeight: 700, letterSpacing: 'var(--letter-spacing-label)', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 'var(--font-size-headline-md)', fontWeight: 700, color: 'var(--color-on-surface)', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 'var(--font-size-body-lg)', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Daily Revenue</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--color-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid var(--color-outline-variant)', borderRadius: 8, color: 'var(--color-on-surface)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              cursor={{ fill: 'rgba(125, 195, 74, 0.08)' }}
            />
            <Bar dataKey="revenue" fill="#7dc34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 'var(--font-size-body-lg)', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Top Products</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Product', 'Qty', 'Revenue'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 'var(--font-size-label)', fontWeight: 700, letterSpacing: 'var(--letter-spacing-label)', textTransform: 'uppercase', color: 'var(--color-muted)', borderBottom: '1px solid var(--color-outline-variant)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(report?.topProducts ?? []).map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                <td style={{ padding: '10px 12px', fontSize: 'var(--font-size-body-sm)', fontWeight: 500 }}>{p.product_name}</td>
                <td style={{ padding: '10px 12px', fontSize: 'var(--font-size-body-sm)', fontVariantNumeric: 'tabular-nums' }}>{p.qty}</td>
                <td style={{ padding: '10px 12px', fontSize: 'var(--font-size-body-sm)', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--color-primary)' }}>{formatPrice(p.revenue, symbol)}</td>
              </tr>
            ))}
            {(report?.topProducts ?? []).length === 0 && (
              <tr><td colSpan={3} style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 'var(--font-size-body-sm)' }}>No data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
