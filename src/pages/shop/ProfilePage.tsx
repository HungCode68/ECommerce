import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const profileSchema = z.object({
  username: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
})

const passwordSchema = z
  .object({
    old_password: z.string().min(6),
    new_password: z.string().min(6, 'Mật khẩu mới tối thiểu 6 ký tự'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirm_password'],
  })

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export function ProfilePage() {
  const { user } = useAuthStore()

  const {
    register: regProfile,
    handleSubmit: submitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: user?.username ?? '', email: user?.email ?? '' },
  })

  const {
    register: regPass,
    handleSubmit: submitPass,
    reset: resetPass,
    formState: { errors: passErrors },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })

  const { mutate: updateProfile, isPending: updatingProfile } = useMutation({
    mutationFn: (data: ProfileFormData) => authApi.updateProfile(data),
    onSuccess: () => {
      toast.success('Cập nhật thành công!')
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  })

  const { mutate: changePassword, isPending: changingPass } = useMutation({
    mutationFn: (data: { old_password: string; new_password: string }) =>
      authApi.changePassword(data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!')
      resetPass()
    },
    onError: () => toast.error('Mật khẩu cũ không đúng'),
  })

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 transition-colors',
      hasError
        ? 'border-red-400 focus:ring-red-200'
        : 'border-slate-200 focus:border-primary focus:ring-primary/20',
    )

  return (
    <div className="container mx-auto max-w-xl px-4 py-8 space-y-6">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Tài khoản của tôi</h1>

      {/* Profile */}
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">Thông tin cá nhân</h2>
        <form onSubmit={submitProfile((d) => updateProfile(d))} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Họ và tên</label>
            <input {...regProfile('username')} className={inputClass(!!profileErrors.username)} />
            {profileErrors.username && <p className="mt-1 text-xs text-red-500">{profileErrors.username.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input {...regProfile('email')} type="email" className={inputClass(!!profileErrors.email)} />
            {profileErrors.email && <p className="mt-1 text-xs text-red-500">{profileErrors.email.message}</p>}
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={updatingProfile} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
              {updatingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">Đổi mật khẩu</h2>
        <form
          onSubmit={submitPass(({ old_password, new_password }) =>
            changePassword({ old_password, new_password })
          )}
          className="space-y-4"
        >
          {[
            { name: 'old_password', label: 'Mật khẩu hiện tại' },
            { name: 'new_password', label: 'Mật khẩu mới' },
            { name: 'confirm_password', label: 'Xác nhận mật khẩu mới' },
          ].map((f) => (
            <div key={f.name}>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{f.label}</label>
              <input
                {...regPass(f.name as keyof PasswordFormData)}
                type="password"
                className={inputClass(!!passErrors[f.name as keyof typeof passErrors])}
              />
              {passErrors[f.name as keyof typeof passErrors] && (
                <p className="mt-1 text-xs text-red-500">
                  {passErrors[f.name as keyof typeof passErrors]?.message}
                </p>
              )}
            </div>
          ))}
          <div className="flex justify-end">
            <button type="submit" disabled={changingPass} className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
              {changingPass && <Loader2 className="h-4 w-4 animate-spin" />}
              Đổi mật khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
