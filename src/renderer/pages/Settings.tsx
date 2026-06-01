import { useEffect, useRef, useState } from 'react'
import { Check, Store, DollarSign, FileText, Shield, Printer, Users, RefreshCw, CheckCircle2, AlertCircle, ScanLine, Plus, Edit2, Trash2, HardDrive } from 'lucide-react'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useSettingsStore } from '../stores/settings.store'
import { useAuthStore } from '../stores/auth.store'
import type { AppSettings, Staff } from '../types'
import styles from './Settings.module.css'

type Tab = 'store' | 'tax' | 'receipt' | 'security' | 'staff' | 'printer' | 'backup'

const TABS: { key: Tab; label: string; icon: React.FC<{ size?: number }> }[] = [
  { key: 'store',   label: 'Store Info',     icon: Store },
  { key: 'tax',     label: 'Tax & Currency', icon: DollarSign },
  { key: 'receipt', label: 'Receipt',        icon: FileText },
  { key: 'security',label: 'Security',       icon: Shield },
  { key: 'staff',   label: 'Staff & PINs',   icon: Users },
  { key: 'printer', label: 'Printing',       icon: Printer },
  { key: 'backup',  label: 'Backup',         icon: HardDrive },
]

const TAB_TITLES: Record<Tab, { title: string; sub: string }> = {
  store:   { title: 'Store Information',  sub: 'Configure store name, contact details and address.' },
  tax:     { title: 'Tax & Currency',     sub: 'Set currency symbol and applicable tax rate.' },
  receipt: { title: 'Receipt Settings',   sub: 'Customise footer text printed on customer receipts.' },
  security:{ title: 'Security',           sub: 'Configure session timeouts and authentication.' },
  staff:   { title: 'Staff & PINs',       sub: 'Manage staff members, roles and PIN codes.' },
  printer: { title: 'Printing & Hardware',sub: 'Configure thermal printer, test print and barcode scanner.' },
  backup:  { title: 'Backup & Restore',   sub: 'Create database backups and restore from a previous backup.' },
}

export function Settings() {
  const { settings, setSettings } = useSettingsStore()
  const session = useAuthStore(s => s.session)
  const [form, setForm] = useState<AppSettings>(settings)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<Tab>('store')

  // Staff state
  const [staffList, setStaffList] = useState<Omit<Staff, 'pin_hash'>[]>([])
  const [editingStaff, setEditingStaff] = useState<Omit<Staff, 'pin_hash'> | null>(null)
  const [staffForm, setStaffForm] = useState({ name: '', pin: '', confirmPin: '', role: 'cashier' as 'cashier' | 'manager' })
  const [staffError, setStaffError] = useState('')
  const [staffSuccess, setStaffSuccess] = useState('')
  const [showAddStaff, setShowAddStaff] = useState(false)

  // Printer state
  const [printers, setPrinters] = useState<{ name: string }[]>([])
  const [loadingPrinters, setLoadingPrinters] = useState(false)
  const [testPrintStatus, setTestPrintStatus] = useState<'idle' | 'printing' | 'ok' | 'fail'>('idle')

  // Barcode scanner state
  const [scanTest, setScanTest] = useState('')
  const [lastScan, setLastScan] = useState<string | null>(null)
  const scanInputRef = useRef<HTMLInputElement>(null)

  // Backup state
  const [backupList, setBackupList] = useState<{ name: string; path: string; size: number; created: number }[]>([])
  const [backupMsg, setBackupMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    api.settings.getAll().then(s => { setSettings(s); setForm(s) })
  }, [])

  useEffect(() => {
    if (tab === 'staff') loadStaff()
    if (tab === 'printer') loadPrinters()
    if (tab === 'backup') api.backup.list().then(setBackupList)
  }, [tab])

  const loadStaff = () => api.staff.list().then(setStaffList)

  const loadPrinters = async () => {
    setLoadingPrinters(true)
    try { setPrinters(await api.print.getPrinters()) }
    finally { setLoadingPrinters(false) }
  }

  const set = (key: keyof AppSettings, value: string) => setForm(f => ({ ...f, [key]: value }))

  const save = async () => {
    await api.settings.setMany(form)
    setSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const discard = async () => {
    const s = await api.settings.getAll()
    setSettings(s); setForm(s)
  }

  // Staff handlers
  const openAddStaff = () => {
    setEditingStaff(null)
    setStaffForm({ name: '', pin: '', confirmPin: '', role: 'cashier' })
    setStaffError(''); setStaffSuccess('')
    setShowAddStaff(true)
  }

  const openEditStaff = (s: Omit<Staff, 'pin_hash'>) => {
    setEditingStaff(s)
    setStaffForm({ name: s.name, pin: '', confirmPin: '', role: s.role as 'cashier' | 'manager' })
    setStaffError(''); setStaffSuccess('')
    setShowAddStaff(true)
  }

  const saveStaff = async () => {
    setStaffError('')
    if (!staffForm.name.trim()) { setStaffError('Name is required'); return }
    if (!editingStaff && staffForm.pin.length < 4) { setStaffError('PIN must be at least 4 digits'); return }
    if (staffForm.pin && !/^\d+$/.test(staffForm.pin)) { setStaffError('PIN must be digits only'); return }
    if (staffForm.pin && staffForm.pin !== staffForm.confirmPin) { setStaffError('PINs do not match'); return }
    try {
      if (editingStaff) {
        const data: { name: string; role: string; pin?: string } = { name: staffForm.name.trim(), role: staffForm.role }
        if (staffForm.pin) data.pin = staffForm.pin
        await api.staff.update(editingStaff.id, data)
        setStaffSuccess(`${staffForm.name} updated`)
      } else {
        await api.staff.create(staffForm.name.trim(), staffForm.pin, staffForm.role)
        setStaffSuccess(`${staffForm.name} added`)
      }
      setShowAddStaff(false)
      loadStaff()
      setTimeout(() => setStaffSuccess(''), 3000)
    } catch (e: unknown) {
      setStaffError(e instanceof Error ? e.message : 'Failed to save')
    }
  }

  const deactivateStaff = async (id: number, name: string) => {
    if (id === session?.id) { setStaffError("Can't deactivate your own account"); return }
    await api.staff.update(id, { active: 0 })
    loadStaff()
    setStaffSuccess(`${name} deactivated`)
    setTimeout(() => setStaffSuccess(''), 3000)
  }

  const reactivateStaff = async (id: number, name: string) => {
    await api.staff.update(id, { active: 1 })
    loadStaff()
    setStaffSuccess(`${name} reactivated`)
    setTimeout(() => setStaffSuccess(''), 3000)
  }

  const deleteStaff = async (id: number, name: string) => {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return
    if (id === session?.id) { setStaffError("Can't delete your own account"); return }
    await api.staff.update(id, { active: 0 })
    loadStaff()
    setStaffSuccess(`${name} removed`)
    setTimeout(() => setStaffSuccess(''), 3000)
  }

  // Printer handlers
  const selectPrinter = (name: string) => {
    setForm(f => ({ ...f, printer_name: name }))
  }

  const testPrint = async () => {
    setTestPrintStatus('printing')
    const html = `<!DOCTYPE html><html><body style="font-family:monospace;padding:16px;"><h2>Test Print</h2><p>${settings.store_name || 'NURTURE POS'}</p><p>Printer: ${form.printer_name || 'default'}</p><p>If you can read this, printing works!</p></body></html>`
    try {
      await api.print.receipt(html, form.printer_name || undefined)
      setTestPrintStatus('ok')
    } catch { setTestPrintStatus('fail') }
    setTimeout(() => setTestPrintStatus('idle'), 4000)
  }

  // Barcode scanner test
  const handleScanInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = (e.target as HTMLInputElement).value.trim()
      if (val) { setLastScan(val); setScanTest('') }
    }
  }

  // Backup handlers
  const createBackup = async () => {
    try {
      const result = await api.backup.create()
      setBackupMsg({ type: 'ok', text: `Backup created: ${result.path}` })
      api.backup.list().then(setBackupList)
    } catch (e: unknown) {
      setBackupMsg({ type: 'err', text: e instanceof Error ? e.message : 'Backup failed' })
    }
    setTimeout(() => setBackupMsg(null), 6000)
  }

  const restoreBackup = async (backupPath: string) => {
    if (!window.confirm('This will replace ALL current data with the selected backup.\n\nA pre-restore backup will be created automatically before restoring.\n\nContinue?')) return
    try {
      await api.backup.restore(backupPath)
      setBackupMsg({ type: 'ok', text: 'Restore complete. A pre-restore backup was saved automatically.' })
      api.backup.list().then(setBackupList)
    } catch (e: unknown) {
      setBackupMsg({ type: 'err', text: e instanceof Error ? e.message : 'Restore failed' })
    }
    setTimeout(() => setBackupMsg(null), 8000)
  }

  const browseRestore = async () => {
    const filePath = await api.backup.selectFile()
    if (!filePath) return
    restoreBackup(filePath)
  }

  const { title, sub } = TAB_TITLES[tab]

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <span className={styles.breadcrumb}>Settings</span>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{title}</span>
      </div>

      <div className={styles.body}>
        <nav className={styles.sidenav}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`${styles.navItem} ${tab === key ? styles.active : ''}`} onClick={() => setTab(key)}>
              <Icon size={16} />{label}
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <h1 className={styles.contentTitle}>{title}</h1>
            <p className={styles.contentSub}>{sub}</p>
          </div>

          {/* ── Store Info ── */}
          {tab === 'store' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Store size={16} /></div>
                <span className={styles.sectionTitle}>Store Details</span>
              </div>
              <div className={styles.grid2}>
                <Input label="Store Name" value={form.store_name} onChange={e => set('store_name', e.target.value)} />
                <Input label="Store Phone" value={form.store_phone} onChange={e => set('store_phone', e.target.value)} />
              </div>
              <div style={{ marginTop: 'var(--space-md)' }}>
                <Input label="Store Address" value={form.store_address} onChange={e => set('store_address', e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Tax & Currency ── */}
          {tab === 'tax' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><DollarSign size={16} /></div>
                <span className={styles.sectionTitle}>Tax & Currency</span>
              </div>
              <div className={styles.grid2}>
                <Input label="Currency Symbol" value={form.currency_symbol} onChange={e => set('currency_symbol', e.target.value)} placeholder="$" />
                <Input label="Tax Rate (%)" type="number" min="0" max="100" step="0.1" value={form.tax_rate} onChange={e => set('tax_rate', e.target.value)} placeholder="0" />
              </div>
            </div>
          )}

          {/* ── Receipt ── */}
          {tab === 'receipt' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><FileText size={16} /></div>
                <span className={styles.sectionTitle}>Receipt Customisation</span>
              </div>
              <Input label="Receipt Footer Text" value={form.receipt_footer} onChange={e => set('receipt_footer', e.target.value)} placeholder="Thank you for shopping with us!" />
              <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--color-surface-high)', borderRadius: 'var(--radius-md)', border: 'var(--border)', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, color: 'var(--color-on-surface-variant)' }}>
                <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--color-on-surface)' }}>{form.store_name || 'My Shop'}</div>
                {form.store_address && <div style={{ textAlign: 'center' }}>{form.store_address}</div>}
                <div style={{ borderTop: '1px dashed var(--color-outline)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Item 1 × 2</span><span>{form.currency_symbol} 50.00</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Item 2 × 1</span><span>{form.currency_symbol} 25.00</span></div>
                <div style={{ borderTop: '1px dashed var(--color-outline)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-on-surface)' }}><span>TOTAL</span><span>{form.currency_symbol} 75.00</span></div>
                <div style={{ borderTop: '1px dashed var(--color-outline)', margin: '8px 0' }} />
                <div style={{ textAlign: 'center' }}>{form.receipt_footer || 'Thank you for your purchase!'}</div>
              </div>
            </div>
          )}

          {/* ── Security ── */}
          {tab === 'security' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><Shield size={16} /></div>
                <span className={styles.sectionTitle}>Session Security</span>
              </div>
              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleLabel}>Automatic Logout</span>
                  <span className={styles.toggleDesc}>Log out operator after idle timeout</span>
                </div>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={parseInt(form.idle_timeout_mins) > 0} onChange={e => set('idle_timeout_mins', e.target.checked ? '5' : '0')} />
                  <span className={styles.toggleTrack} />
                </label>
              </div>
              {parseInt(form.idle_timeout_mins) > 0 && (
                <div style={{ marginTop: 'var(--space-md)' }}>
                  <Input label="Idle Timeout (minutes)" type="number" min="1" max="60" value={form.idle_timeout_mins} onChange={e => set('idle_timeout_mins', e.target.value)} />
                </div>
              )}
            </div>
          )}

          {/* ── Staff & PINs ── */}
          {tab === 'staff' && (
            <>
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}><Users size={16} /></div>
                  <span className={styles.sectionTitle}>Staff Members</span>
                  <button onClick={openAddStaff} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none', borderRadius: 'var(--radius-md)', padding: '6px 14px', fontFamily: 'var(--font-family)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    <Plus size={14} /> Add Staff
                  </button>
                </div>
                {staffSuccess && <div style={{ marginBottom: 'var(--space-md)', padding: '8px 12px', background: 'var(--color-success-subtle)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle2 size={14} />{staffSuccess}</div>}
                {staffError && !showAddStaff && <div style={{ marginBottom: 'var(--space-md)', padding: '8px 12px', background: 'var(--color-error-subtle)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} />{staffError}</div>}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Name', 'Role', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-muted)', borderBottom: 'var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                        <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 600 }}>{s.name} {s.id === session?.id && <span style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 700 }}>YOU</span>}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, textTransform: 'capitalize' }}>{s.role}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 9999, background: !!s.active ? 'var(--color-success-subtle)' : 'var(--color-error-subtle)', color: !!s.active ? 'var(--color-success)' : 'var(--color-error)', border: `1px solid ${!!s.active ? 'var(--color-success)' : 'var(--color-error)'}` }}>
                            {!!s.active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => openEditStaff(s)} title="Edit / Change PIN" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'none', border: 'var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-family)' }}>
                              <Edit2 size={12} /> Edit
                            </button>
                            {!!s.active && s.id !== session?.id && (
                              <button onClick={() => deactivateStaff(s.id, s.name)} title="Deactivate" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'none', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--color-error)', fontFamily: 'var(--font-family)' }}>
                                <Trash2 size={12} /> Deactivate
                              </button>
                            )}
                            {!s.active && s.id !== session?.id && (
                              <>
                                <button onClick={() => reactivateStaff(s.id, s.name)} title="Reactivate" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'none', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--color-success)', fontFamily: 'var(--font-family)' }}>
                                  <CheckCircle2 size={12} /> Reactivate
                                </button>
                                <button onClick={() => deleteStaff(s.id, s.name)} title="Delete permanently" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'none', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--color-error)', fontFamily: 'var(--font-family)' }}>
                                  <Trash2 size={12} /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {showAddStaff && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionIcon}><Users size={16} /></div>
                    <span className={styles.sectionTitle}>{editingStaff ? `Edit: ${editingStaff.name}` : 'Add New Staff'}</span>
                  </div>
                  {staffError && <div style={{ marginBottom: 'var(--space-md)', padding: '8px 12px', background: 'var(--color-error-subtle)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--color-error)' }}>{staffError}</div>}
                  <div className={styles.grid2}>
                    <Input label="Full Name" value={staffForm.name} onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))} placeholder="Staff name" />
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: 4 }}>Role</label>
                      <select value={staffForm.role} onChange={e => setStaffForm(f => ({ ...f, role: e.target.value as 'cashier' | 'manager' }))} style={{ background: 'var(--color-background)', border: 'var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--color-on-surface)', fontFamily: 'var(--font-family)', fontSize: 16, padding: '10px 14px', width: '100%', outline: 'none' }}>
                        <option value="cashier">Cashier</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.grid2} style={{ marginTop: 'var(--space-md)' }}>
                    <Input label={editingStaff ? 'New PIN (leave blank to keep)' : 'PIN *'} type="password" inputMode="numeric" maxLength={8} value={staffForm.pin} onChange={e => setStaffForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))} placeholder="4–8 digits" />
                    <Input label="Confirm PIN" type="password" inputMode="numeric" maxLength={8} value={staffForm.confirmPin} onChange={e => setStaffForm(f => ({ ...f, confirmPin: e.target.value.replace(/\D/g, '') }))} placeholder="Re-enter PIN" />
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={() => { setShowAddStaff(false); setStaffError('') }}>Cancel</Button>
                    <Button onClick={saveStaff}>{editingStaff ? 'Save Changes' : 'Create Staff'}</Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Backup ── */}
          {tab === 'backup' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}><HardDrive size={16} /></div>
                <span className={styles.sectionTitle}>Database Backup</span>
                <button onClick={createBackup} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none', borderRadius: 'var(--radius-md)', padding: '6px 14px', fontFamily: 'var(--font-family)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <HardDrive size={14} /> Create Backup
                </button>
              </div>
              {backupMsg && (
                <div style={{ marginBottom: 'var(--space-md)', padding: '8px 12px', background: backupMsg.type === 'ok' ? 'var(--color-success-subtle)' : 'var(--color-error-subtle)', border: `1px solid ${backupMsg.type === 'ok' ? 'var(--color-success)' : 'var(--color-error)'}`, borderRadius: 'var(--radius-md)', fontSize: 13, color: backupMsg.type === 'ok' ? 'var(--color-success)' : 'var(--color-error)', display: 'flex', alignItems: 'flex-start', gap: 8, wordBreak: 'break-all' }}>
                  {backupMsg.type === 'ok' ? <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
                  {backupMsg.text}
                </div>
              )}
              {backupList.length === 0 ? (
                <div style={{ padding: 'var(--space-lg)', background: 'var(--color-surface-high)', borderRadius: 'var(--radius-md)', border: 'var(--border)', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: 'var(--color-muted)' }}>No backups yet. Click "Create Backup" to make one.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Filename', 'Size', 'Created', 'Actions'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-muted)', borderBottom: 'var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {backupList.map(b => (
                      <tr key={b.path} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                        <td style={{ padding: '10px 12px', fontSize: 13, fontFamily: 'monospace', color: 'var(--color-on-surface-variant)' }}>{b.name}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>{(b.size / 1024).toFixed(1)} KB</td>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>{new Date(b.created * 1000).toLocaleString()}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <button onClick={() => restoreBackup(b.path)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'none', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--color-warning)', fontFamily: 'var(--font-family)' }}>
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)', borderTop: 'var(--border)' }}>
                <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 'var(--space-sm)' }}>Restore from a backup file stored elsewhere:</p>
                <button onClick={browseRestore} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 16px', fontFamily: 'var(--font-family)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--color-on-surface-variant)' }}>
                  <HardDrive size={14} /> Browse &amp; Restore...
                </button>
              </div>
            </div>
          )}

          {/* ── Printer ── */}
          {tab === 'printer' && (
            <>
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}><Printer size={16} /></div>
                  <span className={styles.sectionTitle}>Thermal Printer</span>
                  <button onClick={loadPrinters} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'var(--border)', borderRadius: 'var(--radius-md)', padding: '6px 12px', fontFamily: 'var(--font-family)', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--color-on-surface-variant)' }}>
                    <RefreshCw size={13} /> Refresh
                  </button>
                </div>
                {loadingPrinters ? (
                  <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Scanning for printers…</p>
                ) : printers.length === 0 ? (
                  <div style={{ padding: 'var(--space-lg)', background: 'var(--color-surface-high)', borderRadius: 'var(--radius-md)', border: 'var(--border)', textAlign: 'center' }}>
                    <AlertCircle size={20} color="var(--color-warning)" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>No printers detected</p>
                    <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4 }}>Connect your thermal printer and click Refresh</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {printers.map(p => (
                      <label key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: form.printer_name === p.name ? 'var(--color-primary-subtle)' : 'var(--color-surface-high)', border: form.printer_name === p.name ? 'var(--border-primary)' : 'var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                        <input type="radio" name="printer" value={p.name} checked={form.printer_name === p.name} onChange={() => selectPrinter(p.name)} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: form.printer_name === p.name ? 'var(--color-primary)' : 'var(--color-on-surface)', flex: 1 }}>{p.name}</span>
                        {form.printer_name === p.name && <CheckCircle2 size={16} color="var(--color-primary)" />}
                      </label>
                    ))}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: form.printer_name === '' ? 'var(--color-surface-high)' : 'transparent', border: 'var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                      <input type="radio" name="printer" value="" checked={form.printer_name === ''} onChange={() => selectPrinter('')} />
                      <span style={{ fontSize: 14, color: 'var(--color-on-surface-variant)' }}>System default printer</span>
                    </label>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)', alignItems: 'center' }}>
                  <Button variant="ghost" onClick={testPrint} disabled={testPrintStatus === 'printing'}>
                    <Printer size={14} /> {testPrintStatus === 'printing' ? 'Printing…' : 'Test Print'}
                  </Button>
                  {testPrintStatus === 'ok' && <span style={{ fontSize: 13, color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} /> Printed successfully</span>}
                  {testPrintStatus === 'fail' && <span style={{ fontSize: 13, color: 'var(--color-error)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={14} /> Print failed — check printer</span>}
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}><ScanLine size={16} /></div>
                  <span className={styles.sectionTitle}>Barcode Scanner Test</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 'var(--space-md)' }}>
                  Barcode scanners work as keyboard emulators — no driver needed. Click the field below and scan a barcode to test.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <input
                    ref={scanInputRef}
                    value={scanTest}
                    onChange={e => setScanTest(e.target.value)}
                    onKeyDown={handleScanInput}
                    placeholder="Click here then scan a barcode…"
                    style={{ flex: 1, background: 'var(--color-background)', border: 'var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--color-on-surface)', fontFamily: 'monospace', fontSize: 16, padding: '10px 14px', outline: 'none', transition: 'border-color 150ms' }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={e => e.target.style.borderColor = ''}
                  />
                  <button onClick={() => { setScanTest(''); setLastScan(null) }} style={{ padding: '0 14px', background: 'none', border: 'var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-muted)', fontFamily: 'var(--font-family)', fontSize: 13 }}>Clear</button>
                </div>
                {lastScan && (
                  <div style={{ marginTop: 'var(--space-md)', padding: '10px 14px', background: 'var(--color-success-subtle)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} color="var(--color-success)" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-on-surface)' }}>Scanned: <code style={{ background: 'var(--color-surface-highest)', padding: '2px 6px', borderRadius: 4 }}>{lastScan}</code></span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        {saved && <span className={styles.savedMsg}><Check size={14} /> Changes saved</span>}
        <Button variant="ghost" onClick={discard}>Discard Changes</Button>
        <Button onClick={save}>Update Settings</Button>
      </div>
    </div>
  )
}
