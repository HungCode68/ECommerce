import React, { useEffect, useRef } from 'react'
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

export const GoogleLoginButton = React.memo(function GoogleLoginButton({ className }: GoogleLoginButtonProps) {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const isRenderedRef = useRef(false)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const renderGoogleButton = () => {
    if (!containerRef.current || !window.google?.accounts.id) return

    // Xóa sạch DOM rác nếu có
    containerRef.current.innerHTML = ''

    // Khởi tạo lại với callback mới
    window.google.accounts.id.initialize({
      client_id: clientId as string,
      callback: (response) => {
        if (!response.credential) {
          toast.error('Google không trả về credential hợp lệ')
          // Nếu Google trả về lỗi, render lại nút để chống liệt
          renderGoogleButton()
          return
        }
        loginWithGoogle({ credential: response.credential })
      },
    })

    window.google.accounts.id.renderButton(containerRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'signin',
      shape: 'pill',
      width: 200,
      logo_alignment: 'left',
    })
  }

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
      // QUAN TRỌNG: Google tự động làm "liệt" nút sau 1 lần click thành công (lấy được credential).
      // Nếu call API lỗi (ví dụ backend sập, user chưa đăng ký...), ta bắt buộc phải vẽ lại nút
      // để user có thể click lại lần 2 mà không cần F5.
      renderGoogleButton()
    },
  })

  useEffect(() => {
    if (!clientId || !containerRef.current) return

    const initGoogle = () => {
      if (isRenderedRef.current) return
      renderGoogleButton()
      isRenderedRef.current = true
    }

    if (window.google?.accounts.id) {
      initGoogle()
    } else {
      const existingScript = document.getElementById(GOOGLE_SCRIPT_ID)
      if (existingScript) {
        existingScript.addEventListener('load', initGoogle)
      } else {
        const script = document.createElement('script')
        script.id = GOOGLE_SCRIPT_ID
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = initGoogle
        script.onerror = () => {
          console.error('[GOOGLE_LOGIN] Không thể tải Google SDK')
        }
        document.head.appendChild(script)
      }
    }

    return () => {
      isRenderedRef.current = false
      // Hủy bỏ mọi kết nối/hiển thị của Google SDK trên trang khi component bị gỡ
      if (window.google?.accounts.id) {
        ;(window.google.accounts.id as any).cancel()
      }
    }
  }, [clientId])

  if (!clientId) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs uppercase tracking-wider text-amber-200',
          className,
        )}
      >
        Thiếu VITE_GOOGLE_CLIENT_ID
      </div>
    )
  }

  // Bọc iframe container trong thẻ cha để cô lập nó khỏi quá trình React DOM diffing
  // Sử dụng pointer-events-auto và z-index để chống lỗi bị component khác đè
  return (
    <div className={cn('relative z-50 flex items-center justify-center pointer-events-auto', className)}>
      <div ref={containerRef} />
    </div>
  )
})
