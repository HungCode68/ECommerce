import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const getBirthDateError = (birthDate: string) => {
  const parsedDate = new Date(`${birthDate}T00:00:00`)
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Ngày sinh không hợp lệ'
  }

  const today = new Date()
  if (parsedDate.getFullYear() > today.getFullYear()) {
    return 'Năm sinh không hợp lệ'
  }

  if (parsedDate > today) {
    return 'Ngày sinh không hợp lệ'
  }

  const maxEligibleDate = new Date(
    today.getFullYear() - 100,
    today.getMonth(),
    today.getDate(),
  )
  const minEligibleDate = new Date(
    today.getFullYear() - 16,
    today.getMonth(),
    today.getDate(),
  )

  if (parsedDate < maxEligibleDate) {
    return 'Độ tuổi hợp lệ phải từ 16 đến 100 tuổi'
  }

  if (parsedDate > minEligibleDate) {
    return 'Bạn phải từ 16 tuổi trở lên'
  }

  return null
}

const profileSchema = z.object({
  username: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string()
    .regex(/^(0|\+84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ')
    .or(z.literal(''))
    .optional(),
  birthDate: z.string()
    .min(1, 'Vui lòng chọn ngày sinh')
    .superRefine((value, ctx) => {
      const error = getBirthDateError(value)
      if (error) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: error })
      }
    }),
})

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP phải đủ 6 số').regex(/^\d{6}$/, 'OTP phải là 6 chữ số'),
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
type OTPFormData = z.infer<typeof otpSchema>

export function ProfilePage() {
  const { user, setUser } = useAuthStore()

  const {
    register: regProfile,
    handleSubmit: submitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      birthDate: user?.birth_date ?? '',
    },
  })

  useEffect(() => {
    resetProfile({
      username: user?.username ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      birthDate: user?.birth_date ?? '',
    })
  }, [resetProfile, user])

  const {
    register: regPass,
    handleSubmit: submitPass,
    reset: resetPass,
    formState: { errors: passErrors },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })

  const {
    register: regOtp,
    handleSubmit: submitOtp,
    reset: resetOtp,
    formState: { errors: otpErrors },
  } = useForm<OTPFormData>({ resolver: zodResolver(otpSchema) })

  const { mutate: updateProfile, isPending: updatingProfile } = useMutation({
    mutationFn: (data: ProfileFormData) => authApi.updateProfile({
      username: data.username,
      email: data.email,
      phone: data.phone || '',
      birth_date: data.birthDate,
    }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser)
      toast.success('Cập nhật thành công!')
    },
    onError: (error: unknown) => {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Có lỗi xảy ra'
      toast.error(message)
    },
  })

  const { mutate: changePassword, isPending: changingPass } = useMutation({
    mutationFn: (data: { old_password: string; new_password: string }) =>
      authApi.changePassword(data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!')
      resetPass()
    },
    onError: (error: unknown) => {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.data?.message === 'string'
          ? (error as any).response?.data?.message
          : 'Mật khẩu cũ không đúng'
      toast.error(message)
    },
  })

  const { mutate: sendOtp, isPending: sendingOtp } = useMutation({
    mutationFn: () => authApi.sendEmailVerificationOtp({ email: user?.email ?? '' }),
    onSuccess: () => toast.success('Đã gửi OTP về email của bạn'),
    onError: (error: unknown) => {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Không thể gửi OTP'
      toast.error(message)
    },
  })

  const { mutate: verifyOtp, isPending: verifyingOtp } = useMutation({
    mutationFn: (data: OTPFormData) =>
      authApi.verifyEmailVerificationOtp({ email: user?.email ?? '', otp: data.otp }),
    onSuccess: () => {
      if (user) {
        setUser({ ...user, email_verified: true })
      }
      resetOtp()
      toast.success('Email đã được xác minh')
    },
    onError: (error: unknown) => {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'OTP không đúng hoặc đã hết hạn'
      toast.error(message)
    },
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
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className={cn(
                'rounded-full px-2.5 py-1 font-semibold',
                user?.email_verified
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700',
              )}>
                {user?.email_verified ? 'Email đã xác minh' : 'Email chưa xác minh'}
              </span>
              {!user?.email_verified && (
                <button
                  type="button"
                  onClick={() => sendOtp()}
                  disabled={sendingOtp || !user?.email}
                  className="flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 font-semibold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
                >
                  {sendingOtp && <Loader2 className="h-3 w-3 animate-spin" />}
                  Gửi OTP
                </button>
              )}
            </div>
            {!user?.email_verified && (
              <div className="mt-3 flex gap-2">
                <input
                  {...regOtp('otp')}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Nhập mã OTP 6 số"
                  className={cn(inputClass(!!otpErrors.otp), 'flex-1')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      submitOtp((d) => verifyOtp(d))()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => submitOtp((d) => verifyOtp(d))()}
                  disabled={verifyingOtp}
                  className="flex items-center gap-1 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60 shrink-0"
                >
                  {verifyingOtp && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Xác minh
                </button>
              </div>
            )}
            {!user?.email_verified && otpErrors.otp && <p className="mt-1 text-xs text-red-500">{otpErrors.otp.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Số điện thoại</label>
            <input {...regProfile('phone')} type="tel" placeholder="VD: 0912345678" className={inputClass(!!profileErrors.phone)} />
            {profileErrors.phone && <p className="mt-1 text-xs text-red-500">{profileErrors.phone.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Ngày sinh</label>
            <input {...regProfile('birthDate')} type="date" className={inputClass(!!profileErrors.birthDate)} />
            {profileErrors.birthDate && <p className="mt-1 text-xs text-red-500">{profileErrors.birthDate.message}</p>}
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
      {user?.has_password && (
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
      )}
    </div>
  )
}
