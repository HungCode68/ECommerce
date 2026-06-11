import { type ReactNode, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/utils/constants'
import { getErrorMessage } from '@/utils/httpError'

const FACEBOOK_SCRIPT_ID = 'facebook-jssdk'

declare global {
  interface Window {
    fbAsyncInit?: () => void
    FB?: any
  }
}

type FacebookLoginButtonProps = {
  className?: string
  children?: ReactNode
}

export function FacebookLoginButton({ className, children }: FacebookLoginButtonProps) {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const buttonRef = useRef<HTMLDivElement | null>(null)
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID

  const { mutate: loginWithFacebook, isPending } = useMutation({
    mutationFn: authApi.loginWithFacebook,
    onSuccess: (res) => {
      console.log('[FB_DEBUG] ✅ Backend trả về thành công:', JSON.stringify(res, null, 2))
      console.log('[FB_DEBUG] Gọi setAuth với user:', res.user?.username, 'role:', res.user?.role)
      setAuth(res.user, res.access_token, res.refresh_token)
      toast.success('Đăng nhập Facebook thành công!')
      if (res.user.role === 'admin') {
        console.log('[FB_DEBUG] Navigate -> ADMIN_DASHBOARD')
        navigate(ROUTES.ADMIN_DASHBOARD)
        return
      }
      console.log('[FB_DEBUG] Navigate -> HOME')
      navigate(ROUTES.HOME)
    },
    onError: (error: any) => {
      console.error('[FB_DEBUG] ❌ Backend trả về lỗi:', error?.response?.status, error?.response?.data)
      toast.error(getErrorMessage(error, 'Không thể đăng nhập bằng Facebook'))
    },
  })

  useEffect(() => {
    if (!appId || !buttonRef.current) {
      console.log('[FB_DEBUG] Bỏ qua init SDK: appId=', appId, 'buttonRef=', !!buttonRef.current)
      return
    }

    let cancelled = false

    const initFacebookSdk = () => {
      if (cancelled) return

      window.fbAsyncInit = function () {
        console.log('[FB_DEBUG] FB.init() đang chạy...')
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0',
        })
        console.log('[FB_DEBUG] FB.init() hoàn tất')
      }

      const existingScript = document.getElementById(FACEBOOK_SCRIPT_ID) as HTMLScriptElement | null
      if (!existingScript) {
        const script = document.createElement('script')
        script.id = FACEBOOK_SCRIPT_ID
        script.src = 'https://connect.facebook.net/en_US/sdk.js'
        script.async = true
        script.defer = true
        document.head.appendChild(script)
        console.log('[FB_DEBUG] Đã inject Facebook SDK script')
      } else if (window.FB) {
        console.log('[FB_DEBUG] SDK script đã tồn tại, gọi lại fbAsyncInit')
        window.fbAsyncInit?.()
      }
    }

    initFacebookSdk()

    return () => {
      cancelled = true
    }
  }, [appId])

  const handleLoginClick = () => {
    console.log('[FB_DEBUG] handleLoginClick - FB object:', !!window.FB)
    if (!window.FB) {
      toast.error('Facebook SDK chưa tải xong, vui lòng chờ...')
      return
    }

    console.log('[FB_DEBUG] Gọi FB.login()...')
    window.FB.login(
      (response: any) => {
        console.log('[FB_DEBUG] FB.login callback:', JSON.stringify(response))
        if (response.status === 'connected') {
          const accessToken = response.authResponse.accessToken
          console.log('[FB_DEBUG] Có accessToken, gọi Backend loginWithFacebook...')
          loginWithFacebook({ access_token: accessToken })
        } else {
          console.log('[FB_DEBUG] User hủy hoặc lỗi, status:', response.status)
          toast.error('Bạn đã hủy đăng nhập Facebook')
        }
      },
      { scope: 'public_profile,email' },
    )
  }

  if (!appId) {
    return (
      <div
        className={cn(
          'rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-xs uppercase tracking-wider text-blue-200',
          className,
        )}
      >
        Thiếu `VITE_FACEBOOK_APP_ID`
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <div
        ref={buttonRef}
        role="button"
        onClick={handleLoginClick}
        className={cn(
          'absolute inset-0 z-10 cursor-pointer overflow-hidden rounded-[inherit]',
          isPending && 'pointer-events-none opacity-70',
        )}
      />
      {children}
    </div>
  )
}
