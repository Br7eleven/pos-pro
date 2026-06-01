import { useState, useEffect } from 'react'
import { Plus, Edit2, TrendingDown, Package } from 'lucide-react'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { AddProductModal } from '../components/inventory/AddProductModal'
import { useSettingsStore } from '../stores/settings.store'
import { useAuthStore } from '../stores/auth.store'
import { formatPrice } from '../lib/formatters'
import type { Product } from '../types'
import styles from './Inventory.module.css'

const ADJUST_REASONS = ['Received stock', 'Damaged', 'Lost/Stolen', 'Count correction', 'Other']

export function Inventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | undefined>()
  const [adjusting, setAdjusting] = useState<{ product: Product; delta: string; reason: string; otherReason: string } | null>(null)
  const [adjustError, setAdjustError] = useState('')
  const symbol = useSettingsStore(s => s.settings.currency_symbol)
  const session = useAuthStore(s => s.session)

  const load = () => api.products.list({ search, activeOnly: false }).then(setProducts)

  const confirmAdjust = async () => {
    if (!adjusting) return
    const delta = parseInt(adjusting.delta)
    if (isNaN(delta) || delta === 0) { setAdjustError('Enter a non-zero quantity'); return }
    const reason = adjusting.reason === 'Other' ? adjusting.otherReason.trim() || 'Other' : adjusting.reason
    if (!reason) { setAdjustError('Select a reason'); return }
    setAdjustError('')
    await api.products.adjustStock(adjusting.product.id, delta, reason, session?.id, session?.name)
    load()
    setAdjusting(null)
  }

  useEffect(() => { load() }, [search])

  const stockBadge = (p: Product) => {
    if (p.stock_quantity === 0) return <Badge variant="red">Out</Badge>
    if (p.stock_quantity <= p.low_stock_alert) return <Badge variant="amber">Low: {p.stock_quantity}</Badge>
    return <Badge variant="cyan">{p.stock_quantity}</Badge>
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Inventory</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-body-sm)', marginTop: 2 }}>Manage your products and stock levels</p>
        </div>
        <Button onClick={() => { setEditProduct(undefined); setAddOpen(true) }}>
          <Plus size={16} /> Add Product
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Input placeholder="Search products or barcode..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 56 }}></th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>
                  {p.image_path
                    ? <img src={`product-image:///${p.image_path}`} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--color-outline-variant)', display: 'block' }} />
                    : <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--color-surface-high)', border: '1px solid var(--color-outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={18} color="var(--color-muted)" /></div>
                  }
                </td>
                <td className={styles.prodName}>{p.name}</td>
                <td>{p.category_name ?? '—'}</td>
                <td className={styles.price}>{formatPrice(p.price, symbol)}</td>
                <td>{stockBadge(p)}</td>
                <td><Badge variant={p.active ? 'lime' : 'muted'}>{p.active ? 'Active' : 'Inactive'}</Badge></td>
                <td>
                  <div className={styles.actions}>
                    <Button variant="ghost" size="sm" onClick={() => { setEditProduct(p); setAddOpen(true) }}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" title="Adjust stock" onClick={() => { setAdjustError(''); setAdjusting({ product: p, delta: '', reason: ADJUST_REASONS[0], otherReason: '' }) }}>
                      <TrendingDown size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddProductModal open={addOpen} product={editProduct} onClose={() => { setAddOpen(false); load() }} />

      <Modal
        open={!!adjusting}
        onClose={() => setAdjusting(null)}
        title={`Adjust Stock — ${adjusting?.product.name ?? ''}`}
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setAdjusting(null)}>Cancel</Button>
            <Button onClick={confirmAdjust}>Confirm</Button>
          </div>
        }
      >
        {adjusting && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
              Current stock: <strong style={{ color: 'var(--color-on-surface)' }}>{adjusting.product.stock_quantity}</strong>
            </div>
            <Input
              label="Quantity change (use negative for stock out)"
              type="number"
              value={adjusting.delta}
              onChange={e => setAdjusting(a => a ? { ...a, delta: e.target.value } : a)}
              placeholder="e.g. 10 or -3"
            />
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: 4 }}>Reason</label>
              <select
                value={adjusting.reason}
                onChange={e => setAdjusting(a => a ? { ...a, reason: e.target.value } : a)}
                style={{ background: 'var(--color-background)', border: 'var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--color-on-surface)', fontFamily: 'var(--font-family)', fontSize: 16, padding: '10px 14px', width: '100%', outline: 'none' }}
              >
                {ADJUST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {adjusting.reason === 'Other' && (
              <Input
                label="Describe reason"
                value={adjusting.otherReason}
                onChange={e => setAdjusting(a => a ? { ...a, otherReason: e.target.value } : a)}
                placeholder="Enter reason..."
              />
            )}
            {adjustError && (
              <div style={{ fontSize: 13, color: 'var(--color-error)', padding: '6px 10px', background: 'var(--color-error-subtle)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)' }}>
                {adjustError}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
