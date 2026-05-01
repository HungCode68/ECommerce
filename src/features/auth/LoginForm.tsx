import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/utils/constants'
import type { LoginRequest } from '@/types/auth.types'

const loginSchema = z.object({
  identifier: z.string().min(3, 'Vui lòng nhập tên đăng nhập hoặc email'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const { mutate: login, isPending } = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (res) => {
      setAuth(res.user, res.access_token, res.refresh_token)
      toast.success('Đăng nhập thành công!')
      if (res.user.role === 'admin') {
        navigate(ROUTES.ADMIN_DASHBOARD)
      } else {
        navigate(ROUTES.HOME)
      }
    },
    onError: () => {
      toast.error('Tên đăng nhập hoặc mật khẩu không đúng')
    },
  })

  return (
    <form onSubmit={handleSubmit((d) => login({ identifier: d.identifier, password: d.password }))} className="space-y-6">
      {/* Identifier Input */}
      <div className="space-y-2">
        <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant ml-1">
          Tên đăng nhập
        </label>
        <div className="relative group input-focus-glow transition-all">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors text-xl">
              person
            </span>
          </div>
          <input
            {...register('identifier')}
            type="text"
            disabled={isPending}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface py-4 pl-12 pr-4 text-sm focus:ring-0 focus:border-primary/50 transition-all outline-none rounded-none"
            placeholder="Nhập tên đăng nhập"
          />
        </div>
        {errors.identifier && <p className="text-error text-xs mt-1 ml-1">{errors.identifier.message as string}</p>}
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-end ml-1">
          <label className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant">
            Mật khẩu
          </label>
          <button
            type="button"
            className="text-[10px] uppercase font-bold text-primary/70 hover:text-primary transition-colors disabled:opacity-50"
            disabled
          >
            Quên mật khẩu?
          </button>
        </div>
        <div className="relative group input-focus-glow transition-all">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors text-xl">
              lock
            </span>
          </div>
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            disabled={isPending}
            autoComplete="current-password"
            className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface py-4 pl-12 pr-12 text-sm focus:ring-0 focus:border-primary/50 transition-all outline-none rounded-none"
            placeholder="••••••••••••"
          />
          <div 
            className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer group/eye"
            onClick={() => setShowPassword(!showPassword)}
          >
            <span className="material-symbols-outlined text-outline group-hover/eye:text-on-surface transition-colors text-xl">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </div>
        </div>
        {errors.password && <p className="text-error text-xs mt-1 ml-1">{errors.password.message as string}</p>}
      </div>

      {/* Primary CTA */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-black uppercase tracking-widest text-sm glow-hover transition-all duration-300 transform active:scale-[0.98] mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          'Đăng nhập'
        )}
      </button>
    </form>
  )
}
