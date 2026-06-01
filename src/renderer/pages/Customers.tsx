import { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { formatDate } from '../lib/formatters'
import type { Customer } from '../types'
import styles from './Customers.module.css'

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => { api.customers.list(search || undefined).then(setCustomers) }, [search])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Customers</h1>
          <p className={styles.sub}>Manage customer profiles and loyalty points</p>
        </div>
        <Button><UserPlus size={16} /> Add Customer</Button>
      </div>

      <div className={styles.searchWrap}>
        <Input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Phone</th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Loyalty</th>
              <th className={styles.th}>Since</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className={styles.tr}>
                <td className={`${styles.td} ${styles.nameCell}`}>{c.name}</td>
                <td className={styles.td}>{c.phone ?? '—'}</td>
                <td className={styles.td}>{c.email ?? '—'}</td>
                <td className={styles.td}><Badge variant="purple">{c.loyalty_points} pts</Badge></td>
                <td className={styles.td}>{formatDate(c.created_at)}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={5} className={`${styles.td} ${styles.empty}`}>No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
