import { Outlet } from 'react-router-dom'
import { NavRail } from './NavRail'
import styles from './AppShell.module.css'

export function AppShell() {
  return (
    <div className={styles.shell}>
      <NavRail />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
