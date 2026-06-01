import { ipcMain } from 'electron'
import { z } from 'zod'
import * as db from '../db/transactions'
import { writeAudit } from '../db/audit'

const TransactionItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
})

const TransactionInputSchema = z.object({
  type: z.enum(['sale', 'return']),
  staffId: z.number().int().positive(),
  items: z.array(TransactionItemSchema).min(1),
  paymentMethod: z.enum(['cash', 'card', 'mixed']),
  amountTendered: z.number().nonnegative().optional(),
  customerId: z.number().int().positive().optional(),
  originalTxId: z.number().int().positive().optional(),
  notes: z.string().optional(),
  discount: z.number().nonnegative().optional(),
})

const IdSchema = z.object({ id: z.number().int().positive() })

const ListFiltersSchema = z.object({
  staffId: z.number().int().positive().optional(),
  customerId: z.number().int().positive().optional(),
  type: z.enum(['sale', 'return']).optional(),
  from: z.number().int().optional(),
  to: z.number().int().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
}).optional()

const VoidInputSchema = z.object({
  id: z.number().int().positive(),
  reason: z.string().min(3),
})

ipcMain.handle('db:transactions:create', async (_e, payload) => {
  try {
    const input = TransactionInputSchema.parse(payload)
    const tx = db.createTransaction(input)
    writeAudit({ userId: input.staffId, action: 'SALE_CREATED', entityType: 'transaction', entityId: tx.id, newValue: { total: tx.total, method: tx.payment_method } })
    return tx
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('db:transactions:get', async (_e, payload) => {
  try {
    const { id } = IdSchema.parse(payload)
    return db.getTransactionWithItems(id)
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('db:transactions:list', async (_e, payload) => {
  try {
    const filters = ListFiltersSchema.parse(payload)
    return db.listTransactions(filters)
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('db:transactions:void', async (_e, payload) => {
  try {
    const { id, reason } = VoidInputSchema.parse(payload)
    const result = db.voidTransaction(id, reason)
    writeAudit({ action: 'SALE_VOIDED', entityType: 'transaction', entityId: id, newValue: { reason } })
    return result
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})
