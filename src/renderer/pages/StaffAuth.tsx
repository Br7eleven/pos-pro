import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Delete } from 'lucide-react'
import { useAuthStore } from '../stores/auth.store'
import { useSettingsStore } from '../stores/settings.store'
import { api } from '../lib/api'
import styles from './StaffAuth.module.css'

const KEYS = ['1','2','3','4','5','6','7','8','9','⌫','0','↵']

export function StaffAuth() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const setSession = useAuthStore(s => s.setSession)
  const storeName = useSettingsStore(s => s.settings.store_name)
  const navigate = useNavigate()

  const handleKey = async (key: string) => {
    if (key === '⌫') { setPin(p => p.slice(0, -1)); setError(''); return }
    if (key === '↵') {
      if (!pin) return
      const session = await api.staff.authenticate(pin)
      if (session) {
        setSession(session)
        navigate(session.role === 'manager' ? '/dashboard' : '/terminal')
      } else {
        setError('Incorrect PIN')
        setPin('')
      }
      return
    }
    if (pin.length >= 6) return
    const next = pin + key
    setPin(next)
    setError('')
    if (next.length === 6) {
      const session = await api.staff.authenticate(next)
      if (session) {
        setSession(session)
        navigate(session.role === 'manager' ? '/dashboard' : '/terminal')
      } else {
        setError('Incorrect PIN')
        setPin('')
      }
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
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={`${styles.dot} ${i < pin.length ? styles.filled : ''}`} />
          ))}
        </div>

        <div className={styles.pad}>
          {KEYS.map(k => (
            <button key={k} className={`${styles.key} ${k === '⌫' || k === '↵' ? '' : ''}`}
              onClick={() => handleKey(k)}>
              {k === '⌫' ? <Delete size={24} /> : k}
            </button>
          ))}
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  )
}
