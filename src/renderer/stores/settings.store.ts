import { create } from 'zustand'
import type { AppSettings } from '../types'

interface SettingsState {
  settings: AppSettings
  loaded: boolean
  setSettings: (s: AppSettings) => void
  updateSetting: (key: keyof AppSettings, value: string) => void
}

const defaults: AppSettings = {
  store_name: 'My Shop',
  store_address: '',
  store_phone: '',
  currency_symbol: 'Rs.',
  tax_rate: '0',
  receipt_footer: 'Thank you for shopping with us!',
  idle_timeout_mins: '5',
  printer_name: ''
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaults,
  loaded: false,
  setSettings: (settings) => set({ settings, loaded: true }),
  updateSetting: (key, value) => set((state) => ({ settings: { ...state.settings, [key]: value } }))
}))
