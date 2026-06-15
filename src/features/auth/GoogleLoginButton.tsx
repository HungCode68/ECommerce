import { useEffect, useRef, useState } from 'react'
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
  children?: React.ReactNode
}

export function GoogleLoginButton({ className, children }: GoogleLoginButtonProps) {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const buttonRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const [btnWidth, setBtnWidth] = useState(200)

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
    let lastRenderedWidth = 0

    const renderGoogleButton = (width: number) => {
      if (cancelled || !buttonRef.current || !window.google?.accounts.id) {
        return
      }

      // Clamp width between 200 and 400
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
      const width = containerRef.current?.offsetWidth || 200
      if (width > 0) {
        if (window.google?.accounts.id) {
          renderGoogleButton(width)
        } else {
          const existingScript = document.getElementById(GOOGLE_SCRIPT_ID)
          if (existingScript) {
            existingScript.addEventListener('load', () => {
              const w = containerRef.current?.offsetWidth || 200
              renderGoogleButton(w)
            })
          } else {
            const script = document.createElement('script')
            script.id = GOOGLE_SCRIPT_ID
            script.src = 'https://accounts.google.com/gsi/client'
            script.async = true
            script.defer = true
            script.addEventListener('load', () => {
              const w = containerRef.current?.offsetWidth || 200
              renderGoogleButton(w)
            })
            document.head.appendChild(script)
          }
        }
      }
    }

    let resizeObserver: ResizeObserver | null = null
    if (containerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width
          if (width > 0) {
            setBtnWidth(width)
            if (window.google?.accounts.id) {
              renderGoogleButton(width)
            } else {
              initOrRender()
            }
          }
        }
      })
      resizeObserver.observe(containerRef.current)
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

  // Calculate the width for the absolute overlay container
  const overlayWidth = Math.max(200, btnWidth)

  return (
    <div ref={containerRef} className={cn('relative overflow-visible', className)}>
      {/* Custom Button Content */}
      {children}

      {/* Invisible Google Sign-in button wrapper */}
      <div
        style={{
          width: `${overlayWidth}px`,
          height: '100%',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          cursor: 'pointer',
          // Use filter: opacity(0) to make it invisible to the user
          // while keeping getComputedStyle(el).opacity at 1 to bypass Google's clickjacking checks.
          filter: 'opacity(0)',
          WebkitFilter: 'opacity(0)',
        }}
      >
        <div
          ref={buttonRef}
          className="w-full h-full [&>div]:w-full [&_iframe]:w-full [&>div]:h-full [&_iframe]:h-full"
        />
      </div>
    </div>
  )
}
