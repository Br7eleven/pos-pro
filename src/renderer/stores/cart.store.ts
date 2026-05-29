import { create } from 'zustand'
import type { CartItem, Customer, PaymentMethod, Product } from '../types'

interface CartState {
  items: CartItem[]
  customer: Customer | null
  paymentMethod: PaymentMethod
  transactionDiscount: number

  addItem: (product: Product) => void
  removeItem: (productId: number) => void
  updateQty: (productId: number, qty: number) => void
  setItemDiscount: (productId: number, discount: number) => void
  setCustomer: (customer: Customer | null) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setTransactionDiscount: (discount: number) => void
  clearCart: () => void

  subtotal: () => number
  total: (taxRate: number) => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  paymentMethod: 'cash',
  transactionDiscount: 0,

  addItem: (product) => {
    set((state) => {
      const existing = state.items.find(i => i.product.id === product.id)
      if (existing) {
        return { items: state.items.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) }
      }
      return { items: [...state.items, { product, quantity: 1, discount: 0 }] }
    })
  },

  removeItem: (productId) => set((state) => ({ items: state.items.filter(i => i.product.id !== productId) })),

  updateQty: (productId, qty) => {
    if (qty <= 0) { get().removeItem(productId); return }
    set((state) => ({ items: state.items.map(i => i.product.id === productId ? { ...i, quantity: qty } : i) }))
  },

  setItemDiscount: (productId, discount) =>
    set((state) => ({ items: state.items.map(i => i.product.id === productId ? { ...i, discount } : i) })),

  setCustomer: (customer) => set({ customer }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setTransactionDiscount: (discount) => set({ transactionDiscount: discount }),
  clearCart: () => set({ items: [], customer: null, paymentMethod: 'cash', transactionDiscount: 0 }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity - i.discount, 0),

  total: (taxRate: number) => {
    const subtotal = get().subtotal()
    const afterDiscount = subtotal - get().transactionDiscount
    const tax = Math.round(afterDiscount * taxRate / 100)
    return afterDiscount + tax
  }
}))
