export interface Staff {
  id: number
  name: string
  pin_hash: string
  role: 'cashier' | 'manager'
  active: number
  created_at: number
  updated_at: number
}

export interface StaffSession {
  id: number
  name: string
  role: 'cashier' | 'manager'
}

export interface Category {
  id: number
  name: string
  color: string
}

export interface Product {
  id: number
  barcode: string | null
  sku: string | null
  name: string
  description: string | null
  category_id: number | null
  category_name: string | null
  category_color: string | null
  price: number
  cost_price: number
  stock_quantity: number
  low_stock_alert: number
  image_path: string | null
  active: number
  created_at: number
  updated_at: number
}

export interface ProductInput {
  barcode?: string
  sku?: string
  name: string
  description?: string
  category_id?: number
  price: number
  cost_price?: number
  stock_quantity?: number
  low_stock_alert?: number
  image_path?: string
}

export interface Customer {
  id: number
  name: string
  phone: string | null
  email: string | null
  loyalty_points: number
  notes: string | null
  created_at: number
  updated_at: number
}

export interface Transaction {
  id: number
  type: 'sale' | 'return' | 'refund'
  status: 'completed' | 'voided'
  customer_id: number | null
  staff_id: number
  subtotal: number
  discount: number
  tax: number
  total: number
  payment_method: 'cash' | 'card' | 'mixed'
  amount_tendered: number | null
  change_given: number | null
  notes: string | null
  original_tx_id: number | null
  created_at: number
}

export interface TransactionItem {
  id: number
  transaction_id: number
  product_id: number
  product_name: string
  unit_price: number
  quantity: number
  discount: number
  line_total: number
}

export interface TransactionWithItems extends Transaction {
  items: TransactionItem[]
}

export interface TransactionInput {
  type: 'sale' | 'return'
  staffId: number
  customerId?: number
  originalTxId?: number
  items: { productId: number; quantity: number; unitPrice: number; discount?: number }[]
  paymentMethod: 'cash' | 'card' | 'mixed'
  amountTendered?: number
  discount?: number
  notes?: string
}

export interface CartItem {
  product: Product
  quantity: number
  discount: number
}

export type PaymentMethod = 'cash' | 'card' | 'mixed'

export interface AppSettings {
  store_name: string
  store_address: string
  store_phone: string
  currency_symbol: string
  tax_rate: string
  receipt_footer: string
  idle_timeout_mins: string
  printer_name: string
}
