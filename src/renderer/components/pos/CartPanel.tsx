import { useState } from 'react'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { useCartStore } from '../../stores/cart.store'
import { useSettingsStore } from '../../stores/settings.store'
import { formatPrice } from '../../lib/formatters'
import { CartItemRow } from './CartItemRow'
import { PaymentModal } from './PaymentModal'
import styles from './CartPanel.module.css'

export function CartPanel() {
  const { items, subtotal, total, transactionDiscount, clearCart } = useCartStore()
  const taxRate = parseFloat(useSettingsStore(s => s.settings.tax_rate) || '0')
  const symbol = useSettingsStore(s => s.settings.currency_symbol)
  const [payOpen, setPayOpen] = useState(false)
  const [promoCode, setPromoCode] = useState('')

  const sub = subtotal()
  const tax = Math.round((sub - transactionDiscount) * taxRate / 100)
  const tot = total(taxRate)
  const itemCount = items.reduce((n, i) => n + i.quantity, 0)

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <ShoppingCart size={18} />
          <span className={styles.headerTitle}>Current Order</span>
          {itemCount > 0 && <span className={styles.itemCount}>{itemCount}</span>}
        </div>
        {items.length > 0 && (
          <button className={styles.clearBtn} onClick={clearCart} title="Clear cart">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className={styles.items}>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <ShoppingCart size={32} strokeWidth={1.5} />
            <span>Cart is empty</span>
            <span>Add products to start</span>
          </div>
        ) : (
          items.map(item => <CartItemRow key={item.product.id} item={item} />)
        )}
      </div>

      {items.length > 0 && (
        <>
          {/* Promo code */}
          <div className={styles.promoRow}>
            <input
              className={styles.promoInput}
              placeholder="PROMO CODE..."
              value={promoCode}
              onChange={e => setPromoCode(e.target.value.toUpperCase())}
            />
            <button className={styles.promoBtn}>APPLY</button>
          </div>

          <div className={styles.divider} />

          {/* Totals */}
          <div className={styles.totals}>
            <div className={styles.row}>
              <span>Subtotal ({itemCount} items)</span>
              <span>{formatPrice(sub, symbol)}</span>
            </div>
            {transactionDiscount > 0 && (
              <div className={`${styles.row} ${styles.discount}`}>
                <span>Staff Discount (10%)</span>
                <span>-{formatPrice(transactionDiscount, symbol)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className={styles.row}>
                <span>Tax ({taxRate}%)</span>
                <span>{formatPrice(tax, symbol)}</span>
              </div>
            )}
            <div className={styles.divider} />
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>TOTAL DUE</span>
              <span className={styles.totalValue}>{formatPrice(tot, symbol)}</span>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.chargeBtn} onClick={() => setPayOpen(true)}>
              <ShoppingCart size={18} />
              Charge {formatPrice(tot, symbol)}
            </button>
          </div>

          <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} total={tot} />
        </>
      )}
    </div>
  )
}
