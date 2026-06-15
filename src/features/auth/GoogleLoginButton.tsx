import { useEffect, useRef } from 'react'
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
}

export function GoogleLoginButton({ className }: GoogleLoginButtonProps) {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const buttonRef = useRef<HTMLDivElement | null>(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const { mutate: loginWithGoogle } = useMutation({
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
    if (!clientId) {
      return
    }

    let cancelled = false
    let resizeObserver: ResizeObserver | null = null
    let lastRenderedWidth = 0

    const renderGoogleButton = (width: number) => {
      if (cancelled || !buttonRef.current || !window.google?.accounts.id) {
        return
      }

      // Clamp width between 200 and 400 as required by Google API
      const clampedWidth = Math.max(200, Math.min(400, width))
      
      // If width didn't change significantly, skip rendering to avoid flashing
      if (Math.abs(lastRenderedWidth - clampedWidth) < 10) {
        return
      }

      lastRenderedWidth = clampedWidth
      buttonRef.current.innerHTML = ''
      
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
      
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: clampedWidth,
        logo_alignment: 'left',
      })
    }

    const initOrRender = () => {
      if (!buttonRef.current) return

      const width = buttonRef.current.offsetWidth
      if (width > 0) {
        if (window.google?.accounts.id) {
          renderGoogleButton(width)
        } else {
          const existingScript = document.getElementById(GOOGLE_SCRIPT_ID)
          if (existingScript) {
            existingScript.addEventListener('load', () => {
              if (buttonRef.current) {
                renderGoogleButton(buttonRef.current.offsetWidth)
              }
            })
          } else {
            const script = document.createElement('script')
            script.id = GOOGLE_SCRIPT_ID
            script.src = 'https://accounts.google.com/gsi/client'
            script.async = true
            script.defer = true
            script.addEventListener('load', () => {
              if (buttonRef.current) {
                renderGoogleButton(buttonRef.current.offsetWidth)
              }
            })
            document.head.appendChild(script)
          }
        }
      }
    }

    // Use ResizeObserver to detect when the container width becomes stable (e.g. after animations)
    if (buttonRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width
          if (width > 0) {
            if (window.google?.accounts.id) {
              renderGoogleButton(width)
            } else {
              initOrRender()
            }
          }
        }
      })
      resizeObserver.observe(buttonRef.current)
    }

    initOrRender()

    return () => {
      cancelled = true
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
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
    <div className={cn('relative w-full', className)}>
      <div
        ref={buttonRef}
        className="w-full flex justify-center [&>div]:w-full [&_iframe]:w-full"
      />
    </div>
  )
}
