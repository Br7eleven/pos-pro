import { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { formatDate } from '../lib/formatters'
import type { Customer } from '../types'

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => { api.customers.list(search || undefined).then(setCustomers) }, [search])

  const page: React.CSSProperties = { padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }
  const header: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }
  const title: React.CSSProperties = { fontSize: 'var(--font-size-headline-lg)', fontWeight: 700, letterSpacing: 'var(--letter-spacing-headline)' }
  const th: React.CSSProperties = { textAlign: 'left', padding: '8px 16px', fontSize: 'var(--font-size-label)', fontWeight: 700, letterSpacing: 'var(--letter-spacing-label)', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', borderBottom: 'var(--border)', whiteSpace: 'nowrap' }
  const td: React.CSSProperties = { padding: '10px 16px', fontSize: 'var(--font-size-body-sm)', borderBottom: '1px solid var(--color-surface-high)' }

  return (
    <div style={page}>
      <div style={header}>
        <h1 style={title}>Customers</h1>
        <Button><UserPlus size={16} /> Add Customer</Button>
      </div>

      <div style={{ marginBottom: 'var(--space-md)' }}>
        <Input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><th style={th}>Name</th><th style={th}>Phone</th><th style={th}>Email</th><th style={th}>Loyalty</th><th style={th}>Since</th></tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} style={{ cursor: 'pointer' }}>
                <td style={{ ...td, fontWeight: 600 }}>{c.name}</td>
                <td style={td}>{c.phone ?? '—'}</td>
                <td style={td}>{c.email ?? '—'}</td>
                <td style={td}><Badge variant="purple">{c.loyalty_points} pts</Badge></td>
                <td style={td}>{formatDate(c.created_at)}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
