import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/auth.types'
import { ROUTES } from '@/utils/constants'

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
        console.log('[AUTH_DEBUG] setAuth', {
          username: user?.username,
          role: user?.role,
          hasAccessToken: Boolean(accessToken),
          hasRefreshToken: Boolean(refreshToken),
        })
        set({ user, accessToken, isAuthenticated: true })
      },

      setUser: (user) => {
        set({ user })
      },

      setAccessToken: (token) => {
        console.log('[AUTH_DEBUG] setAccessToken', { hasToken: Boolean(token) })
        set({ accessToken: token, isAuthenticated: true })
      },

      setHasHydrated: (hydrated) => {
        set({ hasHydrated: hydrated })
      },

      logout: () => {
        console.log('[AUTH_DEBUG] logout called')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, isAuthenticated: false })
        window.location.href = ROUTES.LOGIN
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
