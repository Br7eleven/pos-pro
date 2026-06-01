import { ipcMain } from 'electron'
import { z } from 'zod'
import * as db from '../db/staff'
import { writeAudit } from '../db/audit'

const PIN_REGEX = /^\d{4,8}$/

const AuthInputSchema = z.object({
  pin: z.string().regex(PIN_REGEX, 'PIN must be 4-8 digits'),
})

const CreateStaffSchema = z.object({
  name: z.string().min(1),
  pin: z.string().regex(PIN_REGEX, 'PIN must be 4-8 digits'),
  role: z.enum(['cashier', 'manager']),
})

const UpdateStaffSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).optional(),
  pin: z.string().regex(PIN_REGEX, 'PIN must be 4-8 digits').optional(),
  role: z.enum(['cashier', 'manager']).optional(),
  active: z.union([z.literal(0), z.literal(1)]).optional(),
})

ipcMain.handle('staff:authenticate', async (_e, payload) => {
  try {
    const { pin } = AuthInputSchema.parse(payload)
    const result = await db.authenticate(pin)
    if (result) {
      writeAudit({ userId: result.id, userName: result.name, action: 'LOGIN', entityType: 'staff', entityId: result.id })
    } else {
      writeAudit({ action: 'LOGIN_FAILED' })
    }
    return result
  } catch (err) {
    writeAudit({ action: 'LOGIN_FAILED' })
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('staff:list', () => db.listStaff())

ipcMain.handle('staff:create', async (_e, payload) => {
  try {
    const { name, pin, role } = CreateStaffSchema.parse(payload)
    const newStaff = await db.createStaff(name, pin, role)
    writeAudit({ action: 'STAFF_CREATED', entityType: 'staff', entityId: newStaff.id, newValue: { name, role } })
    return newStaff
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('staff:update', async (_e, payload) => {
  try {
    const { id, ...data } = UpdateStaffSchema.parse(payload)
    const updated = await db.updateStaff(id, data)
    writeAudit({ action: 'STAFF_UPDATED', entityType: 'staff', entityId: id })
    return updated
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})
