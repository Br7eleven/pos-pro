import { create } from 'zustand'
import type { StaffSession } from '../types'

interface AuthState {
  session: StaffSession | null
  loginAt: number | null
  setSession: (session: StaffSession) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loginAt: null,
  setSession: (session) => set({ session, loginAt: Date.now() }),
  clearSession: () => set({ session: null, loginAt: null })
}))
