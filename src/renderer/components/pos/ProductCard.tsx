import { Package, Plus } from 'lucide-react'
import { useCartStore } from '../../stores/cart.store'
import { useSettingsStore } from '../../stores/settings.store'
import { formatPrice } from '../../lib/formatters'
import type { Product } from '../../types'
import styles from './ProductCard.module.css'

interface Props { product: Product }

export function ProductCard({ product }: Props) {
  const addItem = useCartStore(s => s.addItem)
  const symbol = useSettingsStore(s => s.settings.currency_symbol)
  const outOfStock = product.stock_quantity <= 0
  const isLow = !outOfStock && product.stock_quantity <= product.low_stock_alert
  const isCritical = !outOfStock && product.stock_quantity <= 2

  const stockVariant = outOfStock ? 'red' : isCritical ? 'red' : isLow ? 'amber' : 'green'
  const stockLabel = outOfStock
    ? 'OUT OF STOCK'
    : isCritical
    ? `${product.stock_quantity} CRITICAL`
    : isLow
    ? `${product.stock_quantity} LOW STOCK`
    : `${product.stock_quantity} IN STOCK`

  return (
    <div
      className={`${styles.card} ${outOfStock ? styles.outOfStock : ''}`}
      onClick={() => !outOfStock && addItem(product)}
      role="button"
      tabIndex={outOfStock ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && !outOfStock && addItem(product)}
    >
      <div className={styles.imgWrap}>
        {product.image_path ? (
          <img src={`file://${product.image_path}`} alt={product.name} className={styles.img} />
        ) : (
          <Package className={styles.placeholder} />
        )}
        <span className={`${styles.stockPill} ${styles[stockVariant]}`}>
          <span className={styles.stockDot} />
          {stockLabel}
        </span>
      </div>

      <div className={styles.info}>
        <span className={styles.name}>{product.name}</span>
        {product.category_name && (
          <span className={styles.category}>{product.category_name.toUpperCase()}</span>
        )}
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatPrice(product.price, symbol)}</span>
          {!outOfStock && (
            <button className={styles.addBtn} onClick={e => { e.stopPropagation(); addItem(product) }}>
              <Plus size={14} /> ADD
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
