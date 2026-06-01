import { useState, useEffect, useRef } from 'react'
import { Search, ScanLine, Bell } from 'lucide-react'
import { api } from '../lib/api'
import { ProductCard } from '../components/pos/ProductCard'
import { CartPanel } from '../components/pos/CartPanel'
import { useAuthStore } from '../stores/auth.store'
import { useSettingsStore } from '../stores/settings.store'
import { useCartStore } from '../stores/cart.store'
import type { Product, Category } from '../types'
import styles from './Terminal.module.css'

export function Terminal() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState<number | undefined>()
  const searchRef = useRef<HTMLInputElement>(null)
  const scanBufRef = useRef('')
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const session = useAuthStore(s => s.session)
  const storeName = useSettingsStore(s => s.settings.store_name)

  useEffect(() => {
    api.categories.list().then(setCategories)
    searchRef.current?.focus()
  }, [])

  useEffect(() => {
    api.products.list({ search, categoryId: activeCat, activeOnly: true }).then(setProducts)
  }, [search, activeCat])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F3') { e.preventDefault(); searchRef.current?.focus(); return }
      // Barcode scanner: HID sends chars very fast then Enter
      // Only capture when search input is NOT focused (scanner fires globally)
      if (document.activeElement === searchRef.current) return
      if (e.key === 'Enter') {
        const code = scanBufRef.current.trim()
        scanBufRef.current = ''
        if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
        if (code.length >= 4) {
          // Treat as barcode scan — search by barcode
          api.products.getByBarcode(code).then(p => {
            if (p) {
              useCartStore.getState().addItem(p)
            } else {
              // fall back to name search
              setSearch(code)
              searchRef.current?.focus()
            }
          })
        }
        return
      }
      if (e.key.length === 1) {
        scanBufRef.current += e.key
        if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
        // If no Enter after 100ms, discard buffer (not a scanner)
        scanTimerRef.current = setTimeout(() => { scanBufRef.current = '' }, 100)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const catCount = (catId: number) => products.filter(p => p.category_id === catId).length

  return (
    <div className={styles.page}>
      <div className={styles.catalog}>

        {/* Top header bar */}
        <div className={styles.topbar}>
          <span className={styles.brandName}>{storeName || 'NURTURE POS'}</span>

          <div className={styles.searchBar}>
            <Search size={16} className={styles.searchIcon} />
            <input
              ref={searchRef}
              className={styles.searchInput}
              placeholder="Scan barcode or search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className={styles.scanBtn} title="Barcode scan">
              <ScanLine size={16} />
            </button>
          </div>

          <div className={styles.topRight}>
            <button className={styles.iconBtn}><Bell size={18} /></button>
            <div className={styles.staffInfo}>
              <span className={styles.staffName}>{session?.name ?? 'Staff'}</span>
              <span className={styles.staffRole}>{session?.role === 'manager' ? 'Manager' : 'Cashier'}</span>
            </div>
            <div className={styles.staffAvatar}>
              {(session?.name ?? 'S').charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div className={styles.catBar}>
          <button
            className={`${styles.catBtn} ${activeCat === undefined ? styles.active : ''}`}
            onClick={() => setActiveCat(undefined)}
          >
            ALL <span className={styles.catCount}>{products.length}</span>
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              className={`${styles.catBtn} ${activeCat === c.id ? styles.active : ''}`}
              onClick={() => setActiveCat(c.id)}
            >
              {c.name.toUpperCase()} <span className={styles.catCount}>{catCount(c.id)}</span>
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {products.map(p => <ProductCard key={p.id} product={p} />)}
          {products.length === 0 && (
            <div className={styles.empty}>No products found</div>
          )}
        </div>
      </div>

      <CartPanel />
    </div>
  )
}
