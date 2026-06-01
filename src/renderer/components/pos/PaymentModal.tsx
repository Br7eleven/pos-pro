import { useState } from 'react'
import { X, CreditCard, Banknote, SplitSquareHorizontal, Tag, Wifi, CheckCircle, Printer } from 'lucide-react'
import { useCartStore } from '../../stores/cart.store'
import { useAuthStore } from '../../stores/auth.store'
import { useSettingsStore } from '../../stores/settings.store'
import { formatPrice } from '../../lib/formatters'
import { buildReceiptHtml } from '../../lib/receipt'
import { api } from '../../lib/api'
import type { PaymentMethod, TransactionWithItems } from '../../types'
import styles from './PaymentModal.module.css'

interface Props { open: boolean; onClose: () => void; total: number }

const METHODS = [
  { key: 'card' as PaymentMethod, label: 'CARD', icon: CreditCard },
  { key: 'cash' as PaymentMethod, label: 'CASH', icon: Banknote },
  { key: 'mixed' as PaymentMethod, label: 'SPLIT', icon: SplitSquareHorizontal },
  { key: null, label: 'VOUCHER', icon: Tag, disabled: true },
]

export function PaymentModal({ open, onClose, total }: Props) {
  const { items, customer, clearCart, subtotal, transactionDiscount } = useCartStore()
  const session = useAuthStore(s => s.session)
  const settings = useSettingsStore(s => s.settings)
  const symbol = settings.currency_symbol
  const taxRate = parseFloat(settings.tax_rate || '0')

  const [method, setMethod] = useState<PaymentMethod>('card')
  const [tendered, setTendered] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [completedTx, setCompletedTx] = useState<TransactionWithItems | null>(null)
  const [printing, setPrinting] = useState(false)

  const sub = subtotal()
  const tax = Math.round((sub - transactionDiscount) * taxRate / 100)
  const tenderedCents = Math.round(parseFloat(tendered || '0') * 100)
  const change = method === 'cash' ? tenderedCents - total : 0
  const itemCount = items.reduce((n, i) => n + i.quantity, 0)

  const confirm = async () => {
    if (method === 'cash' && tenderedCents < total) { setError('Amount tendered is less than total'); return }
    if (!session) return
    setLoading(true)
    try {
      const tx = await api.transactions.create({
        type: 'sale', staffId: session.id, customerId: customer?.id,
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity, unitPrice: i.product.price, discount: i.discount })),
        paymentMethod: method, amountTendered: method === 'cash' ? tenderedCents : undefined
      })
      clearCart()
      setCompletedTx(tx)
      // auto-print if printer configured
      if (settings.printer_name) {
        const html = buildReceiptHtml(tx, settings, session?.name)
        api.print.receipt(html, settings.printer_name).catch(() => {})
      }
    } catch { setError('Transaction failed. Please try again.') }
    finally { setLoading(false) }
  }

  const printReceipt = async () => {
    if (!completedTx) return
    setPrinting(true)
    try {
      const html = buildReceiptHtml(completedTx, settings, session?.name)
      await api.print.receipt(html, settings.printer_name || undefined)
    } catch { /* silently fail — printer may not be connected */ }
    finally { setPrinting(false) }
  }

  const handleClose = () => {
    setCompletedTx(null)
    setTendered('')
    setError('')
    onClose()
  }

  if (!open) return null

  // ── Receipt confirmation screen ──────────────────────
  if (completedTx) {
    return (
      <div className={styles.overlay}>
        <div className={styles.successDialog}>
          <div className={styles.successIcon}><CheckCircle size={48} color="var(--color-primary)" /></div>
          <h2 className={styles.successTitle}>Payment Complete</h2>
          <p className={styles.successSub}>Transaction #{completedTx.id} recorded successfully</p>
          <div className={styles.successTotal}>{formatPrice(completedTx.total, symbol)}</div>
          {completedTx.change_given != null && completedTx.change_given > 0 && (
            <div className={styles.successChange}>
              Change: <strong>{formatPrice(completedTx.change_given, symbol)}</strong>
            </div>
          )}
          <div className={styles.successActions}>
            <button className={styles.printBtn} onClick={printReceipt} disabled={printing}>
              <Printer size={16} />
              {printing ? 'Printing…' : 'Print Receipt'}
            </button>
            <button className={styles.confirmBtn} onClick={handleClose}>
              New Sale
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Payment entry screen ─────────────────────────────
  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
      <div className={styles.dialog}>

        {/* Left — Order Summary */}
        <div className={styles.left}>
          <div className={styles.leftHeader}>
            <h2 className={styles.leftTitle}>Order Summary</h2>
            <p className={styles.txNum}>{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>
          <div className={styles.itemsList}>
            {items.map(item => (
              <div key={item.product.id} className={styles.itemRow}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.product.name}</span>
                  <span className={styles.itemQty}>Qty: {item.quantity}</span>
                </div>
                <span className={styles.itemPrice}>{formatPrice(item.product.price * item.quantity - item.discount, symbol)}</span>
              </div>
            ))}
          </div>
          <div className={styles.leftDivider} />
          <div className={styles.totalsBlock}>
            <div className={styles.totalLine}>
              <span>Subtotal</span>
              <span>{formatPrice(sub, symbol)}</span>
            </div>
            {taxRate > 0 && (
              <div className={styles.totalLine}>
                <span>Tax ({taxRate}%)</span>
                <span>{formatPrice(tax, symbol)}</span>
              </div>
            )}
            <div className={styles.grandTotal}>
              <span className={styles.grandLabel}>Total</span>
              <span className={styles.grandValue}>{formatPrice(total, symbol)}</span>
            </div>
          </div>
        </div>

        {/* Right — Payment Method */}
        <div className={styles.right}>
          <div className={styles.rightHeader}>
            <h2 className={styles.rightTitle}>Payment Method</h2>
            <button className={styles.closeBtn} onClick={handleClose}><X size={18} /></button>
          </div>

          <div className={styles.methodGrid}>
            {METHODS.map(m => (
              <button key={m.label}
                className={`${styles.methodBtn} ${m.key && method === m.key ? styles.methodActive : ''} ${m.disabled ? styles.methodDisabled : ''}`}
                onClick={() => !m.disabled && m.key && setMethod(m.key)}
                disabled={m.disabled}>
                <m.icon size={22} />
                <span className={styles.methodLabel}>{m.label}</span>
              </button>
            ))}
          </div>

          {method !== 'cash' && (
            <div className={styles.nfcArea}>
              <div className={styles.nfcRing}>
                <Wifi size={28} style={{ transform: 'rotate(90deg)', color: 'var(--color-primary)' }} />
              </div>
              <p className={styles.nfcTitle}>Present Card or Device</p>
              <p className={styles.nfcSub}>Terminal is ready to accept payment.</p>
            </div>
          )}

          {method === 'cash' && (
            <div className={styles.cashArea}>
              <label className={styles.cashLabel}>AMOUNT TENDERED</label>
              <div className={styles.cashInputWrap}>
                <span className={styles.cashSymbol}>{symbol}</span>
                <input className={styles.cashInput} type="number" min="0" step="0.01"
                  placeholder={(total / 100).toFixed(2)} value={tendered}
                  onChange={e => { setTendered(e.target.value); setError('') }} autoFocus />
              </div>
              {error && <p className={styles.errorMsg}>{error}</p>}
              {tenderedCents >= total && tenderedCents > 0 && (
                <div className={styles.changeRow}>
                  <span className={styles.changeLabel}>Change Due</span>
                  <span className={styles.changeValue}>{formatPrice(change, symbol)}</span>
                </div>
              )}
            </div>
          )}

          {error && method !== 'cash' && <p className={styles.errorMsg}>{error}</p>}

          <div className={styles.rightFooter}>
            <button className={styles.cancelBtn} onClick={handleClose}>CANCEL</button>
            <button className={styles.confirmBtn} onClick={confirm} disabled={loading}>
              {loading ? 'PROCESSING…' : 'CONFIRM PAYMENT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
