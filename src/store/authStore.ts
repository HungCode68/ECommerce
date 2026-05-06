import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/auth.types'

type AuthState = {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  hasHydrated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setUser: (user: User) => void
  setAccessToken: (token: string) => void
  setHasHydrated: (hydrated: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('refresh_token', refreshToken)
        set({ user, accessToken, isAuthenticated: true })
      },

      setUser: (user) => {
        set({ user })
      },

      setAccessToken: (token) => {
        set({ accessToken: token, isAuthenticated: true })
      },

      setHasHydrated: (hydrated) => {
        set({ hasHydrated: hydrated })
      },

      logout: () => {
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, isAuthenticated: false })
        // Redirect về trang login
        window.location.href = '/dang-nhap'
      },
    }),
    {
      name: 'auth-storage',
      // Persist user và isAuthenticated để duy trì session khi F5
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
