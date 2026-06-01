import { useState, useEffect } from 'react'
import { RotateCcw, AlertTriangle } from 'lucide-react'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthStore } from '../stores/auth.store'
import { useSettingsStore } from '../stores/settings.store'
import { formatPrice, formatDateTime, todayUnix } from '../lib/formatters'
import type { Transaction, TransactionWithItems } from '../types'
import styles from './Refunds.module.css'

export function Refunds() {
  const session = useAuthStore(s => s.session)
  const symbol = useSettingsStore(s => s.settings.currency_symbol)
  const [search, setSearch] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selected, setSelected] = useState<TransactionWithItems | null>(null)
  const [refundQtys, setRefundQtys] = useState<Record<number, number>>({})
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const today = todayUnix()

  const loadTransactions = async () => {
    const all = await api.transactions.list({ from: today - 30 * 86400, to: today + 86400 })
    // collect IDs of sales that already have a return
    const refundedIds = new Set(
      all.filter(t => t.type === 'return' && t.original_tx_id != null).map(t => t.original_tx_id!)
    )
    setTransactions(all.filter(t => t.status === 'completed' && t.type === 'sale' && !refundedIds.has(t.id)))
  }

  useEffect(() => { loadTransactions() }, [])

  const selectTx = async (id: number) => {
    const tx = await api.transactions.get(id)
    if (!tx) return
    setSelected(tx)
    const qtys: Record<number, number> = {}
    tx.items.forEach(i => { qtys[i.product_id] = i.quantity })
    setRefundQtys(qtys)
    setSuccess(null)
    setError(null)
  }

  const filtered = search
    ? transactions.filter(t => String(t.id).includes(search))
    : transactions

  const refundTotal = selected
    ? selected.items.reduce((s, i) => s + i.unit_price * (refundQtys[i.product_id] ?? 0), 0)
    : 0

  const submitRefund = async () => {
    if (!selected || !session) return
    if (!reason.trim()) { setError('Refund reason is required'); return }
    if (refundTotal <= 0) { setError('Select at least one item to refund'); return }
    setLoading(true)
    try {
      await api.transactions.create({
        type: 'return',
        staffId: session.id,
        originalTxId: selected.id,
        items: selected.items
          .filter(i => (refundQtys[i.product_id] ?? 0) > 0)
          .map(i => ({ productId: i.product_id, quantity: refundQtys[i.product_id], unitPrice: i.unit_price, discount: 0 })),
        paymentMethod: selected.payment_method,
        notes: reason
      })
      setSuccess(`Refund of ${formatPrice(refundTotal, symbol)} processed`)
      setSelected(null)
      setReason('')
      loadTransactions()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Refund failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Refunds</h1>
          <p className={styles.sub}>Process returns and refunds for completed sales</p>
        </div>
      </div>

      {success && (
        <div className={styles.successBanner}>{success}</div>
      )}

      <div className={styles.body}>
        {/* Left: transaction list */}
        <div className={styles.txList}>
          <div className={styles.searchWrap}>
            <Input placeholder="Search by transaction ID…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className={styles.txItems}>
            {filtered.length === 0 && <p className={styles.empty}>No completed sales found</p>}
            {filtered.map(tx => (
              <div key={tx.id} className={`${styles.txRow} ${selected?.id === tx.id ? styles.txRowActive : ''}`} onClick={() => selectTx(tx.id)}>
                <div className={styles.txRowLeft}>
                  <span className={styles.txId}>#{tx.id}</span>
                  <span className={styles.txDate}>{formatDateTime(tx.created_at)}</span>
                </div>
                <span className={styles.txAmount}>{formatPrice(tx.total, symbol)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: refund form */}
        <div className={styles.refundForm}>
          {!selected ? (
            <div className={styles.emptyState}>
              <RotateCcw size={40} strokeWidth={1.5} color="var(--color-muted)" />
              <p>Select a transaction to process a refund</p>
            </div>
          ) : (
            <>
              <div className={styles.formHeader}>
                <h2>Transaction #{selected.id}</h2>
                <span className={styles.methodPill}>{selected.payment_method}</span>
              </div>

              <div className={styles.itemsTable}>
                {selected.items.map(item => (
                  <div key={item.product_id} className={styles.itemRow}>
                    <div className={styles.itemName}>{item.product_name}</div>
                    <div className={styles.itemOrigQty}>Sold: {item.quantity}</div>
                    <div className={styles.itemRefundQty}>
                      <button
                        onClick={() => setRefundQtys(q => ({ ...q, [item.product_id]: Math.max(0, (q[item.product_id] ?? item.quantity) - 1) }))}
                        className={styles.qtyBtn}
                      >−</button>
                      <span className={styles.qtyNum}>{refundQtys[item.product_id] ?? item.quantity}</span>
                      <button
                        onClick={() => setRefundQtys(q => ({ ...q, [item.product_id]: Math.min(item.quantity, (q[item.product_id] ?? item.quantity) + 1) }))}
                        className={styles.qtyBtn}
                      >+</button>
                    </div>
                    <div className={styles.itemRefundAmt}>{formatPrice(item.unit_price * (refundQtys[item.product_id] ?? item.quantity), symbol)}</div>
                  </div>
                ))}
              </div>

              <div className={styles.refundTotal}>
                <span>Refund Total</span>
                <span className={styles.refundTotalAmt}>{formatPrice(refundTotal, symbol)}</span>
              </div>

              <div style={{ marginTop: 'var(--space-md)' }}>
                <Input
                  label="Reason for Refund *"
                  value={reason}
                  onChange={e => { setReason(e.target.value); setError(null) }}
                  placeholder="Customer returned item, damaged, etc."
                />
              </div>

              {error && (
                <div className={styles.errorMsg}>
                  <AlertTriangle size={14} />{error}
                </div>
              )}

              <div className={styles.formActions}>
                <Button variant="ghost" onClick={() => { setSelected(null); setError(null) }}>Cancel</Button>
                <Button onClick={submitRefund} disabled={loading || refundTotal <= 0}>
                  {loading ? 'Processing…' : `Refund ${formatPrice(refundTotal, symbol)}`}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
