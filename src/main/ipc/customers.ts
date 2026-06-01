import { ipcMain } from 'electron'
import { z } from 'zod'
import * as db from '../db/customers'

const ListSearchSchema = z.object({
  search: z.string().optional(),
}).optional()

const IdSchema = z.object({ id: z.number().int().positive() })

const PhoneSchema = z.object({ phone: z.string().min(1) })

const CreateCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
})

const UpdateCustomerSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
})

const AddPointsSchema = z.object({
  id: z.number().int().positive(),
  points: z.number().positive(),
})

ipcMain.handle('db:customers:list', async (_e, payload) => {
  try {
    const parsed = ListSearchSchema.parse(payload ?? {})
    return db.listCustomers(parsed?.search)
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('db:customers:get', async (_e, payload) => {
  try {
    const { id } = IdSchema.parse(payload)
    return db.getCustomer(id)
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('db:customers:getByPhone', async (_e, payload) => {
  try {
    const { phone } = PhoneSchema.parse(payload)
    return db.getCustomerByPhone(phone)
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('db:customers:create', async (_e, payload) => {
  try {
    const data = CreateCustomerSchema.parse(payload)
    return db.createCustomer(data)
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('db:customers:update', async (_e, payload) => {
  try {
    const { id, ...data } = UpdateCustomerSchema.parse(payload)
    return db.updateCustomer(id, data)
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('db:customers:addPoints', async (_e, payload) => {
  try {
    const { id, points } = AddPointsSchema.parse(payload)
    return db.addLoyaltyPoints(id, points)
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})
