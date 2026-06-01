import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { StaffAuth } from './pages/StaffAuth'
import { Terminal } from './pages/Terminal'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import { Customers } from './pages/Customers'
import { Reports } from './pages/Reports'
import { Refunds } from './pages/Refunds'
import { Settings } from './pages/Settings'
import { useAuthStore } from './stores/auth.store'
import { useSettingsStore } from './stores/settings.store'
import { api } from './lib/api'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = useAuthStore(s => s.session)
  if (!session) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function ManagerRoute({ children }: { children: React.ReactNode }) {
  const session = useAuthStore(s => s.session)
  if (!session) return <Navigate to="/auth" replace />
  if (session.role !== 'manager') return <Navigate to="/terminal" replace />
  return <>{children}</>
}

export default function App() {
  const setSettings = useSettingsStore(s => s.setSettings)

  useEffect(() => {
    api.settings.getAll().then(setSettings).catch(() => {})
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/auth" element={<StaffAuth />} />
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<Navigate to="/terminal" replace />} />
          <Route path="/terminal" element={<Terminal />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/reports" element={<ManagerRoute><Reports /></ManagerRoute>} />
          <Route path="/refunds" element={<ManagerRoute><Refunds /></ManagerRoute>} />
          <Route path="/settings" element={<ManagerRoute><Settings /></ManagerRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </HashRouter>
  )
}
