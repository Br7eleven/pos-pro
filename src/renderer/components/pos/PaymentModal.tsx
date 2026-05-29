import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useCartStore } from '../../stores/cart.store'
import { useAuthStore } from '../../stores/auth.store'
import { useSettingsStore } from '../../stores/settings.store'
import { formatPrice } from '../../lib/formatters'
import { api } from '../../lib/api'
import type { PaymentMethod } from '../../types'
import styles from './PaymentModal.module.css'

interface Props { open: boolean; onClose: () => void; total: number }

export function PaymentModal({ open, onClose, total }: Props) {
  const { items, customer, clearCart } = useCartStore()
  const session = useAuthStore(s => s.session)
  const symbol = useSettingsStore(s => s.settings.currency_symbol)
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [tendered, setTendered] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const tenderedCents = Math.round(parseFloat(tendered || '0') * 100)
  const change = method === 'cash' ? tenderedCents - total : 0

  const confirm = async () => {
    if (method === 'cash' && tenderedCents < total) {
      setError('Amount tendered is less than total')
      return
    }
    if (!session) return
    setLoading(true)
    try {
      await api.transactions.create({
        type: 'sale',
        staffId: session.id,
        customerId: customer?.id,
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity, unitPrice: i.product.price, discount: i.discount })),
        paymentMethod: method,
        amountTendered: method === 'cash' ? tenderedCents : undefined
      })
      clearCart()
      onClose()
      setTendered('')
      setError('')
    } catch {
      setError('Transaction failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Payment" size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={confirm} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </>
      }
    >
      <div className={styles.methods}>
        {(['cash', 'card', 'mixed'] as PaymentMethod[]).map(m => (
          <button key={m} className={`${styles.methodBtn} ${method === m ? styles.active : ''}`}
            onClick={() => setMethod(m)}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.totalDisplay}>
        <div className={styles.totalLabel}>Total Due</div>
        <div className={styles.totalAmount}>{formatPrice(total, symbol)}</div>
      </div>

      {method === 'cash' && (
        <Input
          label="Amount Tendered"
          type="number"
          min="0"
          step="0.01"
          placeholder={`${(total / 100).toFixed(2)}`}
          value={tendered}
          onChange={e => { setTendered(e.target.value); setError('') }}
          error={error}
          autoFocus
        />
      )}

      {method === 'cash' && tenderedCents >= total && (
        <div className={styles.changeRow}>
          <span className={styles.changeLabel}>Change</span>
          <span className={styles.changeValue}>{formatPrice(change, symbol)}</span>
        </div>
      )}

      {method !== 'cash' && error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-body-sm)' }}>{error}</p>}
    </Modal>
  )
}
