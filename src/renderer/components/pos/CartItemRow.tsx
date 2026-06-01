import { Minus, Plus, Package } from 'lucide-react'
import { useCartStore } from '../../stores/cart.store'
import { useSettingsStore } from '../../stores/settings.store'
import { formatPrice } from '../../lib/formatters'
import type { CartItem } from '../../types'
import styles from './CartItemRow.module.css'

interface Props { item: CartItem }

export function CartItemRow({ item }: Props) {
  const { updateQty, removeItem } = useCartStore()
  const symbol = useSettingsStore(s => s.settings.currency_symbol)
  const lineTotal = item.product.price * item.quantity - item.discount

  return (
    <div className={styles.row}>
      <div className={styles.thumb}>
        {item.product.image_path ? (
          <img src={`product-image:///${item.product.image_path}`} alt={item.product.name} className={styles.thumbImg} />
        ) : (
          <Package size={18} className={styles.thumbIcon} />
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.name}>{item.product.name}</div>
        <div className={styles.unitPrice}>{formatPrice(item.product.price, symbol)} / EA</div>
      </div>

      <div className={styles.right}>
        <div className={styles.lineTotal}>{formatPrice(lineTotal, symbol)}</div>
        <div className={styles.qty}>
          <button className={styles.qtyBtn} onClick={() => updateQty(item.product.id, item.quantity - 1)}>
            <Minus size={12} />
          </button>
          <span className={styles.qtyNum}>{item.quantity}</span>
          <button className={styles.qtyBtn} onClick={() => updateQty(item.product.id, item.quantity + 1)}>
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
