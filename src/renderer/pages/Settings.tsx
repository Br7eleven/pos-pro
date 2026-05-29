import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useSettingsStore } from '../stores/settings.store'
import type { AppSettings } from '../types'
import styles from './Settings.module.css'

export function Settings() {
  const { settings, setSettings } = useSettingsStore()
  const [form, setForm] = useState<AppSettings>(settings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.settings.getAll().then(s => { setSettings(s); setForm(s) })
  }, [])

  const set = (key: keyof AppSettings, value: string) => setForm(f => ({ ...f, [key]: value }))

  const save = async () => {
    await api.settings.setMany(form)
    setSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Store Info</h2>
        <div className={styles.grid2}>
          <Input label="Store Name" value={form.store_name} onChange={e => set('store_name', e.target.value)} />
          <Input label="Store Phone" value={form.store_phone} onChange={e => set('store_phone', e.target.value)} />
        </div>
        <div style={{ marginTop: 'var(--space-md)' }}>
          <Input label="Store Address" value={form.store_address} onChange={e => set('store_address', e.target.value)} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Tax & Currency</h2>
        <div className={styles.grid2}>
          <Input label="Currency Symbol" value={form.currency_symbol} onChange={e => set('currency_symbol', e.target.value)} />
          <Input label="Tax Rate (%)" type="number" min="0" max="100" step="0.1" value={form.tax_rate} onChange={e => set('tax_rate', e.target.value)} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Receipt</h2>
        <Input label="Receipt Footer Text" value={form.receipt_footer} onChange={e => set('receipt_footer', e.target.value)} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Security</h2>
        <Input label="Idle Timeout (minutes)" type="number" min="1" max="60" value={form.idle_timeout_mins} onChange={e => set('idle_timeout_mins', e.target.value)} />
      </div>

      <div className={styles.actions}>
        {saved && <span className={styles.saved}><Check size={16} /> Saved</span>}
        <Button onClick={save}>Save Settings</Button>
      </div>
    </div>
  )
}
