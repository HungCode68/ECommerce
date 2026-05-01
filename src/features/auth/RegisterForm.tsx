import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { authApi } from '@/api/auth.api'
import type { RegisterRequest } from '@/types/auth.types'
import { isAxiosError } from 'axios'

const registerSchema = z.object({
  name: z.string()
    .min(3, 'Tên đăng nhập tối thiểu 3 ký tự')
    .max(50, 'Tên đăng nhập tối đa 50 ký tự')
    .regex(/^[a-zA-Z0-9]+$/, 'Tên đăng nhập chỉ bao gồm chữ không dấu và số, không chứa khoảng trắng'),
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').max(50, 'Mật khẩu tối đa 50 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

interface Props {
  onSuccess: (email: string) => void
}

export function RegisterForm({ onSuccess }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const { mutate: registerAccount, isPending } = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (_, variables) => {
      toast.success('Tạo tài khoản thành công!')
      onSuccess(variables.email)
    },
    onError: (err) => {
      if (isAxiosError(err) && err.response?.status === 409) {
        toast.error('Email đã được sử dụng')
      } else {
        toast.error('Có lỗi xảy ra, thử lại sau')
      }
    },
  })

  return (
    <form onSubmit={handleSubmit((d) => registerAccount({ username: d.name, email: d.email, password: d.password }))} className="space-y-6">
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
            {...formRegister('name')}
            type="text"
            disabled={isPending}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface py-4 pl-12 pr-4 text-sm focus:ring-0 focus:border-primary/50 transition-all outline-none rounded-none"
            placeholder="nguyenvana123"
          />
        </div>
        {errors.name && <p className="text-error text-xs mt-1 ml-1">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant ml-1">
          Địa chỉ Email
        </label>
        <div className="relative group input-focus-glow transition-all">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors text-xl">
              mail
            </span>
          </div>
          <input
            {...formRegister('email')}
            type="email"
            disabled={isPending}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface py-4 pl-12 pr-4 text-sm focus:ring-0 focus:border-primary/50 transition-all outline-none rounded-none"
            placeholder="example@shopvn.com"
          />
        </div>
        {errors.email && <p className="text-error text-xs mt-1 ml-1">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant ml-1">
          Mật khẩu
        </label>
        <div className="relative group input-focus-glow transition-all">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors text-xl">
              lock
            </span>
          </div>
          <input
            {...formRegister('password')}
            type={showPassword ? 'text' : 'password'}
            disabled={isPending}
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
        {errors.password && <p className="text-error text-xs mt-1 ml-1">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant ml-1">
          Xác nhận mật khẩu
        </label>
        <div className="relative group input-focus-glow transition-all">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors text-xl">
              lock_reset
            </span>
          </div>
          <input
            {...formRegister('confirmPassword')}
            type={showConfirm ? 'text' : 'password'}
            disabled={isPending}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface py-4 pl-12 pr-12 text-sm focus:ring-0 focus:border-primary/50 transition-all outline-none rounded-none"
            placeholder="••••••••••••"
          />
          <div 
            className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer group/eye"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            <span className="material-symbols-outlined text-outline group-hover/eye:text-on-surface transition-colors text-xl">
              {showConfirm ? 'visibility_off' : 'visibility'}
            </span>
          </div>
        </div>
        {errors.confirmPassword && <p className="text-error text-xs mt-1 ml-1">{errors.confirmPassword.message}</p>}
      </div>

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
          'Tạo tài khoản'
        )}
      </button>
    </form>
  )
}
