import type { Product, ProductInput, Category, Customer, Transaction, TransactionWithItems, TransactionInput, Staff, StaffSession, AppSettings } from '../types'

declare global {
  interface Window {
    api: {
      products: {
        list: (filters?: { categoryId?: number; search?: string; activeOnly?: boolean }) => Promise<Product[]>
        get: (id: number) => Promise<Product | null>
        getByBarcode: (barcode: string) => Promise<Product | null>
        create: (input: ProductInput) => Promise<Product>
        update: (id: number, input: Partial<ProductInput>) => Promise<Product>
        adjustStock: (id: number, delta: number, reason: string, userId?: number, userName?: string) => Promise<Product>
        stockMovements: (productId?: number) => Promise<{ id: number; product_id: number; product_name: string; delta: number; reason: string; user_id: number | null; user_name: string | null; before_qty: number; after_qty: number; created_at: number }[]>
      }
      categories: {
        list: () => Promise<Category[]>
        create: (name: string, color: string) => Promise<Category>
      }
      dialog: {
        selectImage: () => Promise<string | null>
      }
      transactions: {
        create: (input: TransactionInput) => Promise<TransactionWithItems>
        get: (id: number) => Promise<TransactionWithItems | null>
        list: (filters?: { from?: number; to?: number; staffId?: number; type?: string }) => Promise<Transaction[]>
        void: (id: number, reason: string) => Promise<Transaction>
      }
      customers: {
        list: (search?: string) => Promise<Customer[]>
        get: (id: number) => Promise<Customer | null>
        getByPhone: (phone: string) => Promise<Customer | null>
        create: (data: { name: string; phone?: string; email?: string; notes?: string }) => Promise<Customer>
        update: (id: number, data: Partial<Customer>) => Promise<Customer>
        addPoints: (id: number, points: number) => Promise<Customer>
      }
      staff: {
        authenticate: (pin: string) => Promise<StaffSession | null>
        list: () => Promise<Omit<Staff, 'pin_hash'>[]>
        create: (name: string, pin: string, role: string) => Promise<Omit<Staff, 'pin_hash'>>
        update: (id: number, data: object) => Promise<Omit<Staff, 'pin_hash'>>
      }
      reports: {
        daily: (date: number) => Promise<object>
        range: (from: number, to: number) => Promise<object>
      }
      settings: {
        getAll: () => Promise<AppSettings>
        set: (key: string, value: string) => Promise<void>
        setMany: (data: Partial<AppSettings>) => Promise<void>
      }
      print: {
        getPrinters: () => Promise<{ name: string }[]>
        receipt: (html: string, printerName?: string) => Promise<void>
      }
      audit: {
        list: (filters?: { from?: number; to?: number; action?: string; limit?: number }) => Promise<{ id: number; user_name: string | null; action: string; entity_type: string | null; entity_id: number | null; new_value: string | null; created_at: number }[]>
      }
      backup: {
        create: () => Promise<{ path: string; timestamp: string }>
        list: () => Promise<{ name: string; path: string; size: number; created: number }[]>
        selectFile: () => Promise<string | null>
        restore: (backupPath: string) => Promise<{ preBackupPath: string }>
      }
    }
  }
}

export const api = window.api
