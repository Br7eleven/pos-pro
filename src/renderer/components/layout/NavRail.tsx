import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutGrid, Monitor, Package, Users, BarChart2, RotateCcw, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import styles from './NavRail.module.css'

const NAV = [
  { path: '/terminal', icon: Monitor, label: 'POS' },
  { path: '/dashboard', icon: LayoutGrid, label: 'Dash' },
  { path: '/inventory', icon: Package, label: 'Stock' },
  { path: '/customers', icon: Users, label: 'Clients' },
  { path: '/reports', icon: BarChart2, label: 'Reports' },
  { path: '/refunds', icon: RotateCcw, label: 'Refunds' },
  { path: '/settings', icon: Settings, label: 'Setup' }
]

export function NavRail() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { session, clearSession } = useAuthStore()

  const isManagerRoute = ['/reports', '/refunds', '/settings'].includes(pathname)
  if (session?.role === 'cashier' && isManagerRoute) return null

  return (
    <nav className={styles.rail}>
      <div className={styles.logo}>N</div>

      <div className={styles.nav}>
        {NAV.map(({ path, icon: Icon, label }) => {
          if (path === '/reports' && session?.role === 'cashier') return null
          if (path === '/refunds' && session?.role === 'cashier') return null
          if (path === '/settings' && session?.role === 'cashier') return null
          return (
            <button
              key={path}
              className={`${styles.navItem} ${pathname.startsWith(path) ? styles.active : ''}`}
              onClick={() => navigate(path)}
              title={label}
            >
              <Icon size={20} />
              <span className={styles.navLabel}>{label}</span>
            </button>
          )
        })}
      </div>

      <div className={styles.bottom}>
        <button className={styles.staffBtn} title={session?.name ?? 'Staff'} onClick={() => {
          clearSession()
          navigate('/auth')
        }}>
          {session ? (
            <span>{session.name.charAt(0).toUpperCase()}</span>
          ) : (
            <LogOut size={16} />
          )}
        </button>
      </div>
    </nav>
  )
}
