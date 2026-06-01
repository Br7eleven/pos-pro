import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Delete } from 'lucide-react'
import { useAuthStore } from '../stores/auth.store'
import { useSettingsStore } from '../stores/settings.store'
import { api } from '../lib/api'
import styles from './StaffAuth.module.css'

const KEYS = ['1','2','3','4','5','6','7','8','9','⌫','0','↵']
const MAX_PIN = 8
const MIN_PIN = 4

export function StaffAuth() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setSession = useAuthStore(s => s.setSession)
  const storeName = useSettingsStore(s => s.settings.store_name)
  const navigate = useNavigate()

  const tryAuth = async (code: string) => {
    if (code.length < MIN_PIN) { setError(`PIN must be at least ${MIN_PIN} digits`); return }
    setLoading(true)
    const session = await api.staff.authenticate(code)
    setLoading(false)
    if (session) {
      setSession(session)
      navigate(session.role === 'manager' ? '/dashboard' : '/terminal')
    } else {
      setError('Incorrect PIN')
      setPin('')
    }
  }

  const handleKey = async (key: string) => {
    if (loading) return
    if (key === '⌫') { setPin(p => p.slice(0, -1)); setError(''); return }
    if (key === '↵') {
      if (!pin) return
      await tryAuth(pin)
      return
    }
    if (pin.length >= MAX_PIN) return
    const next = pin + key
    setPin(next)
    setError('')
    // auto-try on every digit at or above min — silent fail lets them keep typing
    if (next.length >= MIN_PIN) {
      setLoading(true)
      const session = await api.staff.authenticate(next)
      setLoading(false)
      if (session) {
        setSession(session)
        navigate(session.role === 'manager' ? '/dashboard' : '/terminal')
      }
      // no error on silent fail — user can keep typing more digits
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <div className={styles.logo}>N</div>
        <h1 className={styles.storeName}>{storeName}</h1>
        <p className={styles.sub}>Enter staff PIN to continue</p>
      </div>

      <div className={styles.card}>
        <div className={styles.dots}>
          {Array.from({ length: Math.max(pin.length, MIN_PIN) }).map((_, i) => (
            <span key={i} className={`${styles.dot} ${i < pin.length ? styles.filled : ''}`} />
          ))}
        </div>

        <div className={styles.pad}>
          {KEYS.map(k => (
            <button key={k}
              className={`${styles.key} ${k === '⌫' ? styles.keyBack : ''} ${k === '↵' ? `${styles.keyEnter} ${pin.length >= MIN_PIN ? styles.ready : ''}` : ''}`}
              onClick={() => handleKey(k)}
              disabled={loading}>
              {k === '⌫' ? <Delete size={24} /> : k}
            </button>
          ))}
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {loading && <p className={styles.error} style={{ color: 'var(--color-muted)' }}>Checking…</p>}
      </div>
    </div>
  )
}
