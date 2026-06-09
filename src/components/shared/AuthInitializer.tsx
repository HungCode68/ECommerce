import axios from 'axios'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { ApiResponse } from '@/types/api.types'
import { useAuthStore } from '@/store/authStore'
import { API_BASE_URL } from '@/utils/constants'
import { getBlockedAccountMessage, isBlockedAccountError } from '@/utils/authErrors'
import { consumeAuthNotice, storeAuthNotice } from '@/utils/authNotice'

type RefreshSessionData = {
  access_token: string
  refresh_token: string
}

const parseFacebookHash = () => {
  if (!window.location.hash) return null
  const hashStr = window.location.hash.substring(1)
  const params = new URLSearchParams(hashStr)
  return params.get('access_token')
}

let authBootstrapPromise: Promise<void> | null = null
let authBootstrapCompleted = false

export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const [isInitializing, setIsInitializing] = useState(true)
  const { accessToken, hasHydrated, setAccessToken, logout } = useAuthStore()

  useEffect(() => {
    const notice = consumeAuthNotice()
    if (notice) {
      toast.error(notice)
    }
  }, [])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    if (authBootstrapCompleted) {
      setIsInitializing(false)
      return
    }

    let cancelled = false

    const restoreSession = async () => {
      // 1. Kiểm tra URL xem Facebook có redirect fallback chứa access_token không
      const fbToken = parseFacebookHash()
      if (fbToken) {
        try {
          console.log('[AUTH_DEBUG] Bắt được Facebook fallback token trong URL')
          // Xóa hash để URL sạch
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
          
          const { data } = await axios.post(`${(API_BASE_URL as string) === '/' ? '' : API_BASE_URL}/api/auth/facebook`, {
            access_token: fbToken,
          })
          
          const res = data.data
          useAuthStore.getState().setAuth(res.user, res.access_token, res.refresh_token)
          toast.success('Đăng nhập Facebook thành công!')
          return
        } catch (error) {
          console.error('[AUTH_DEBUG] Lỗi khi xử lý Facebook fallback token:', error)
          toast.error('Lỗi xác thực Facebook. Vui lòng thử lại.')
        }
      }

      if (accessToken) {
        return
      }

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        return
      }

      const { data } = await axios.post<ApiResponse<RefreshSessionData>>(
        `${(API_BASE_URL as string) === '/' ? '' : API_BASE_URL}/api/auth/refresh`,
        {
          refresh_token: refreshToken,
        },
      )

      const nextRefreshToken = data.data.refresh_token
      localStorage.setItem('refresh_token', nextRefreshToken)
      setAccessToken(data.data.access_token)
    }

    const sessionPromise =
      authBootstrapPromise ??
      (authBootstrapPromise = restoreSession()
        .catch((error) => {
          console.error('Failed to initialize auth session:', error)
          if (isBlockedAccountError(error)) {
            storeAuthNotice(getBlockedAccountMessage())
          }
          logout()
        })
        .finally(() => {
          authBootstrapCompleted = true
          authBootstrapPromise = null
        }))

    void sessionPromise.finally(() => {
      if (!cancelled) {
        setIsInitializing(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [hasHydrated, accessToken, setAccessToken, logout])

  if (isInitializing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="text-blue-500 text-xl font-bold animate-pulse tracking-widest uppercase">
            Restoring Session...
          </div>
          <div className="h-1 w-48 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 animate-[loading_2s_ease-in-out_infinite]"></div>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes loading {
            0% { width: 0%; margin-left: 0%; }
            50% { width: 50%; margin-left: 25%; }
            100% { width: 0%; margin-left: 100%; }
          }
        `}} />
      </div>
    )
  }

  return <>{children}</>
}
