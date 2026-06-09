import { type ReactNode, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/utils/constants'
import { getErrorMessage } from '@/utils/httpError'

const GOOGLE_SCRIPT_ID = 'google-identity-services'

type GoogleLoginButtonProps = {
  className?: string
  children?: ReactNode
}

export function GoogleLoginButton({ className, children }: GoogleLoginButtonProps) {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const buttonRef = useRef<HTMLDivElement | null>(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const { mutate: loginWithGoogle, isPending } = useMutation({
    mutationFn: authApi.loginWithGoogle,
    onSuccess: (res) => {
      setAuth(res.user, res.access_token, res.refresh_token)
      toast.success('Đăng nhập Google thành công!')
      if (res.user.role === 'admin') {
        navigate(ROUTES.ADMIN_DASHBOARD)
        return
      }
      navigate(ROUTES.HOME)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Không thể đăng nhập bằng Google'))
    },
  })

  useEffect(() => {
    if (!clientId || !buttonRef.current) {
      return
    }

    let cancelled = false
    const container = buttonRef.current

    const renderGoogleButton = () => {
      if (cancelled || !container || !window.google?.accounts.id) {
        return
      }

      container.innerHTML = ''
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response.credential) {
            toast.error('Google không trả về credential hợp lệ')
            return
          }
          loginWithGoogle({ credential: response.credential })
        },
      })
      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: Math.max(container.offsetWidth, 260),
        logo_alignment: 'left',
      })
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null
    let script = existingScript
    const onLoad = () => renderGoogleButton()

    if (window.google?.accounts.id) {
      renderGoogleButton()
    } else if (existingScript) {
      existingScript.addEventListener('load', onLoad)
    } else {
      script = document.createElement('script')
      script.id = GOOGLE_SCRIPT_ID
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.addEventListener('load', onLoad)
      document.head.appendChild(script)
    }

    return () => {
      cancelled = true
      script?.removeEventListener('load', onLoad)
    }
  }, [clientId, loginWithGoogle])

  if (!clientId) {
    return (
      <div className={cn(
        'rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs uppercase tracking-wider text-amber-200',
        className,
      )}>
        Thiếu `VITE_GOOGLE_CLIENT_ID`
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      <div
        ref={buttonRef}
        className={cn(
          'absolute inset-0 z-10 overflow-hidden rounded-[inherit] opacity-0 [&>div]:!h-full [&>div]:!w-full [&_div[role=button]]:!h-full [&_div[role=button]]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full',
          isPending && 'pointer-events-none opacity-70',
        )}
      />
    </div>
  )
}
