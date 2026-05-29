import { useState, useEffect } from 'react'
import { Plus, Edit2, TrendingDown } from 'lucide-react'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { AddProductModal } from '../components/inventory/AddProductModal'
import { useSettingsStore } from '../stores/settings.store'
import { formatPrice } from '../lib/formatters'
import type { Product } from '../types'
import styles from './Inventory.module.css'

export function Inventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | undefined>()
  const symbol = useSettingsStore(s => s.settings.currency_symbol)

  const load = () => api.products.list({ search, activeOnly: false }).then(setProducts)

  useEffect(() => { load() }, [search])

  const stockBadge = (p: Product) => {
    if (p.stock_quantity === 0) return <Badge variant="red">Out</Badge>
    if (p.stock_quantity <= p.low_stock_alert) return <Badge variant="amber">Low: {p.stock_quantity}</Badge>
    return <Badge variant="cyan">{p.stock_quantity}</Badge>
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Inventory</h1>
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
                    <Button variant="ghost" size="sm" title="Adjust stock">
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
    </div>
  )
}
