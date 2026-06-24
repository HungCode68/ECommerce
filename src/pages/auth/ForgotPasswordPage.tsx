import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'

import kcTechLogo from '@/assets/kc-tech-logo.svg'
import { authApi } from '@/api/auth.api'
import { ROUTES } from '@/utils/constants'

// --- Bước 1: Gửi Email ---
const emailSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
})
type EmailFormData = z.infer<typeof emailSchema>

// --- Bước 2: Nhập OTP & Mật khẩu mới ---
const resetSchema = z.object({
  otp: z.string().length(6, 'Mã OTP phải có 6 chữ số').regex(/^\d+$/, 'Mã OTP chỉ chứa số'),
  new_password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirm_password"]
})
type ResetFormData = z.infer<typeof resetSchema>

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  // -- Forms --
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' }
  })

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { otp: '', new_password: '', confirm_password: '' }
  })

  // -- Mutations --
  const { mutate: sendOtp, isPending: isSendingOtp } = useMutation({
    mutationFn: (data: EmailFormData) => authApi.sendForgotPasswordOtp(data),
    onSuccess: (_, variables) => {
      toast.success('Đã gửi mã OTP thành công. Vui lòng kiểm tra email.')
      setEmail(variables.email)
      setStep(2)
      setCountdown(60)
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra, thử lại sau')
      } else {
        toast.error('Có lỗi xảy ra, thử lại sau')
      }
    }
  })

  const { mutate: resetPassword, isPending: isResetting } = useMutation({
    mutationFn: (data: ResetFormData) => authApi.resetPassword({
      email,
      otp: data.otp,
      new_password: data.new_password
    }),
    onSuccess: () => {
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.')
      navigate(ROUTES.LOGIN)
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'OTP không hợp lệ hoặc đã hết hạn.')
      } else {
        toast.error('Có lỗi xảy ra, thử lại sau')
      }
    }
  })

  const onEmailSubmit = (data: EmailFormData) => sendOtp(data)
  const onResetSubmit = (data: ResetFormData) => resetPassword(data)

  const handleOtpNext = async () => {
    const isOtpValid = await resetForm.trigger('otp')
    if (isOtpValid) {
      setStep(3)
    }
  }

  return (
    <div className="light bg-background text-on-background min-h-screen overflow-x-hidden font-body">
      {/* TopNavBar */}
      <header className="absolute top-0 w-full z-50 flex justify-between items-center px-8 h-20 max-w-full bg-transparent">
        <Link to={ROUTES.HOME} className="hover:opacity-80 transition-opacity">
          <img
            src={kcTechLogo}
            alt="KC Tech"
            className="h-10 w-auto saturate-150 contrast-125 brightness-110 drop-shadow-[0_2px_10px_rgba(124,58,237,0.28)]"
          />
        </Link>
        <div className="hidden md:flex gap-6 items-center">
          <button className="text-xs font-medium text-slate-500 uppercase tracking-widest">HƯỚNG DẪN MUA HÀNG</button>
          <div className="h-4 w-[1px] bg-outline-variant/30"></div>
          <button className="text-sm font-bold text-primary px-4 py-2 rounded-full hover:bg-primary-container/10 transition-all">Hỗ Trợ Khách Hàng</button>
        </div>
      </header>

      <main className="flex min-h-screen pt-20 md:pt-0">
        {/* Left Side: Showcase (60%) */}
        <section className="hidden md:flex md:w-3/5 relative overflow-hidden items-center justify-center px-12 py-12 lg:px-20 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.22),transparent_30%),linear-gradient(135deg,#070b1f_0%,#141b3b_45%,#24124a_100%)] text-white">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(124,58,237,0.82)_0%,rgba(30,27,75,0.92)_100%)]" />
          <div className="absolute -left-24 top-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />

          <div className="relative z-10 flex h-full w-full max-w-2xl flex-col justify-between">
            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-10">
                <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight lg:text-5xl">
                  <span className="rounded-2xl bg-white px-3 py-2 text-violet-700 shadow-lg shadow-black/10">KC</span>
                  KC Tech
                </h1>
              </div>

              <div className="max-w-xl">
                <h2 className="mb-4 text-3xl font-bold leading-tight lg:text-5xl">
                  Bảo Mật Tài Khoản
                </h2>
                <p className="text-base leading-8 text-violet-100 lg:text-lg">
                  Lấy lại quyền truy cập tài khoản dễ dàng và an toàn với hệ thống khôi phục mật khẩu thông minh của chúng tôi.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/20 pt-5 text-sm text-violet-100/80">
              <span>© 2026 KC Technology</span>
              <span className="hidden lg:inline">Vietnam Modern Commerce Experience</span>
            </div>
          </div>
        </section>

        {/* Right Side: Form (40%) */}
        <section className="w-full md:w-2/5 flex items-center justify-center bg-surface p-8 lg:p-16 relative overflow-hidden">
          <div className="w-full max-w-md relative z-10">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <header className="mb-8">
                <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight mb-2">Quên Mật Khẩu?</h1>
                <p className="text-on-surface-variant font-medium">
                  {step === 1 ? 'Nhập email đã đăng ký để nhận mã khôi phục.' : step === 2 ? `Mã xác thực đã được gửi tới ${email}` : 'Tạo mật khẩu mới an toàn.'}
                </p>
              </header>

              {step === 1 && (
                <form className="space-y-6" onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block ml-1">ĐỊA CHỈ EMAIL</label>
                    <div className="relative group">
                      <input
                        {...emailForm.register('email')}
                        disabled={isSendingOtp}
                        className="w-full bg-surface-container-low border-none rounded-xl py-4 px-5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all"
                        placeholder="VD: nguyenvan@example.com"
                      />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-primary-container transition-all duration-300 group-focus-within:w-full"></div>
                    </div>
                    {emailForm.formState.errors.email && <p className="text-xs text-error mt-1 ml-1">{emailForm.formState.errors.email.message}</p>}
                  </div>

                  <button
                    disabled={isSendingOtp}
                    className="w-full bg-primary-container text-on-primary-container font-headline font-bold py-5 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group disabled:opacity-70 disabled:pointer-events-none"
                    type="submit"
                  >
                    {isSendingOtp ? (
                      <><Loader2 className="animate-spin w-5 h-5" /> Đang xử lý...</>
                    ) : (
                      <>
                        Nhận mã OTP
                        <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">mail</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block ml-1">MÃ OTP</label>
                    <div className="relative group">
                      <input
                        {...resetForm.register('otp')}
                        disabled={isResetting}
                        maxLength={6}
                        className="w-full bg-surface-container-low border-none rounded-xl py-4 px-5 text-on-surface text-center tracking-[0.5em] font-mono text-xl placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all"
                        placeholder="------"
                      />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-primary-container transition-all duration-300 group-focus-within:w-full"></div>
                    </div>
                    {resetForm.formState.errors.otp && <p className="text-xs text-error mt-1 ml-1">{resetForm.formState.errors.otp.message}</p>}
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => sendOtp({ email })}
                        disabled={countdown > 0 || isSendingOtp}
                        className="text-xs font-semibold text-primary hover:text-primary-container-dark transition-colors disabled:opacity-50"
                      >
                        {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : 'Gửi lại mã OTP'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOtpNext}
                    className="w-full bg-primary-container text-on-primary-container font-headline font-bold py-5 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
                  >
                    Xác nhận OTP
                    <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                  </button>
                </div>
              )}

              {step === 3 && (
                <form className="space-y-6" onSubmit={resetForm.handleSubmit(onResetSubmit)}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block ml-1">MẬT KHẨU MỚI</label>
                    <div className="relative group">
                      <input
                        {...resetForm.register('new_password')}
                        disabled={isResetting}
                        className="w-full bg-surface-container-low border-none rounded-xl py-4 px-5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all pr-12"
                        type={showPassword ? "text" : "password"}
                        placeholder="Tối thiểu 6 ký tự"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                      </button>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-primary-container transition-all duration-300 group-focus-within:w-full"></div>
                    </div>
                    {resetForm.formState.errors.new_password && <p className="text-xs text-error mt-1 ml-1">{resetForm.formState.errors.new_password.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block ml-1">XÁC NHẬN MẬT KHẨU</label>
                    <div className="relative group">
                      <input
                        {...resetForm.register('confirm_password')}
                        disabled={isResetting}
                        className="w-full bg-surface-container-low border-none rounded-xl py-4 px-5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all pr-12"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                      </button>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-primary-container transition-all duration-300 group-focus-within:w-full"></div>
                    </div>
                    {resetForm.formState.errors.confirm_password && <p className="text-xs text-error mt-1 ml-1">{resetForm.formState.errors.confirm_password.message}</p>}
                  </div>

                  <button
                    disabled={isResetting}
                    className="w-full bg-primary-container text-on-primary-container font-headline font-bold py-5 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group disabled:opacity-70 disabled:pointer-events-none"
                    type="submit"
                  >
                    {isResetting ? (
                      <><Loader2 className="animate-spin w-5 h-5" /> Đang lưu...</>
                    ) : (
                      <>
                        Lưu mật khẩu mới
                        <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">check_circle</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-8 text-center">
                <button
                  onClick={() => navigate(ROUTES.LOGIN)}
                  type="button"
                  className="text-on-surface-variant font-medium hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Quay lại đăng nhập
                </button>
              </div>

            </motion.div>
          </div>
        </section>
      </main>
    </div>
  )
}
