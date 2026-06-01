import { ipcMain } from 'electron'
import { z } from 'zod'
import * as db from '../db/settings'
import { writeAudit } from '../db/audit'

const ALLOWED_KEYS = [
  'store_name',
  'store_address',
  'store_phone',
  'currency_symbol',
  'tax_rate',
  'receipt_footer',
  'idle_timeout_mins',
  'printer_name',
] as const

const AllowedKeyEnum = z.enum(ALLOWED_KEYS)

const SetSettingSchema = z.object({
  key: AllowedKeyEnum,
  value: z.string(),
})

const SetManySchema = z.record(z.string(), z.string()).transform((data, ctx) => {
  const result: Partial<Record<typeof ALLOWED_KEYS[number], string>> = {}
  for (const key of Object.keys(data)) {
    const parsed = AllowedKeyEnum.safeParse(key)
    if (!parsed.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Unknown settings key: ${key}`,
      })
      return z.NEVER
    }
    result[parsed.data] = data[key]
  }
  return result
})

ipcMain.handle('settings:getAll', () => db.getAllSettings())

ipcMain.handle('settings:set', async (_e, payload) => {
  try {
    const { key, value } = SetSettingSchema.parse(payload)
    const result = db.setSetting(key, value)
    writeAudit({ action: 'SETTINGS_CHANGED', entityType: 'setting', newValue: { key, value } })
    return result
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})

ipcMain.handle('settings:setMany', async (_e, payload) => {
  try {
    const data = SetManySchema.parse(payload)
    const result = db.setManySettings(data)
    writeAudit({ action: 'SETTINGS_CHANGED', newValue: data })
    return result
  } catch (err) {
    if (err instanceof z.ZodError) throw new Error(err.errors[0].message)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Operation failed')
  }
})
