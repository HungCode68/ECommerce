import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import { toast } from 'sonner'
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'

import kcTechLogo from '@/assets/kc-tech-logo.svg'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth.api'
import { ROUTES } from '@/utils/constants'

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
    return 'Năm sinh không hợp lệ'
  }

  if (parsedDate > minEligibleDate) {
    return 'Bạn phải từ 16 tuổi trở lên để đăng ký'
  }

  return null
}

const registerSchema = z.object({
  name: z.string()
    .min(3, 'Tên đăng nhập tối thiểu 3 ký tự')
    .max(50, 'Tên đăng nhập tối đa 50 ký tự')
    .regex(/^[a-zA-Z0-9]+$/, 'Tên đăng nhập chỉ được chứa chữ cái và số (không khoảng cách)'),
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  birthDate: z.string()
    .min(1, 'Vui lòng chọn ngày sinh')
    .superRefine((value, ctx) => {
      const error = getBirthDateError(value)
      if (error) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: error })
      }
    }),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine(
  data => data.password === data.confirmPassword,
  { message: 'Mật khẩu không khớp', path: ['confirmPassword'] }
)

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(ROUTES.HOME, { replace: true })
    }
  }, [isAuthenticated, user, navigate])


  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', birthDate: '', password: '', confirmPassword: '' }
  })


  const { mutate: registerAccount, isPending: isRegisterSubmitting } = useMutation({
    mutationFn: (data: RegisterFormData) => authApi.register({
      username: data.name,
      email: data.email,
      password: data.password,
      birth_date: data.birthDate,
    }),
    onSuccess: () => {
      toast.success('Tạo tài khoản thành công! Vui lòng đăng nhập.')
      navigate(ROUTES.LOGIN)
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const apiErrors = error.response?.data?.errors

        if ((status === 409 || status === 400) && apiErrors) {
          console.log('Register validation errors:', apiErrors)
          Object.entries(apiErrors).forEach(([field, msg]) => {
            const fieldLower = field.toLowerCase()
            if (fieldLower === 'username') {
              registerForm.setError('name', { message: msg as string })
            } else if (fieldLower === 'email') {
              registerForm.setError('email', { message: msg as string })
            } else if (fieldLower === 'birth_date') {
              registerForm.setError('birthDate', { message: msg as string })
            } else if (fieldLower === 'password') {
              registerForm.setError('password', { message: msg as string })
            }
          })
        } else if (status === 409) {
          // Fallback if apiErrors map is missing but status is 409
          if (error.response?.data?.message?.toLowerCase().includes('email')) {
            registerForm.setError('email', { message: 'Email đã tồn tại' })
          } else {
            registerForm.setError('name', { message: 'Tên đăng nhập đã tồn tại' })
          }
        } else {
          toast.error(error.response?.data?.message || 'Có lỗi xảy ra, thử lại sau')
        }
      } else {
        toast.error('Có lỗi xảy ra, thử lại sau')
      }
    }
  })

  const onRegisterSubmit = (data: RegisterFormData) => registerAccount(data)

  return (
    <div className="light bg-background text-on-background min-h-screen overflow-x-hidden font-body">
      {/* TopNavBar */}
      <header className="absolute top-0 w-full z-50 flex justify-between items-center px-8 h-20 max-w-full bg-transparent">
        <Link to={ROUTES.HOME} className="hover:opacity-80 transition-opacity">
          <img src={kcTechLogo} alt="KC Tech" className="h-10 w-auto" />
        </Link>
        <div className="hidden md:flex gap-6 items-center">
          <button className="text-xs font-medium text-slate-500 uppercase tracking-widest">HƯỚNG DẪN MUA HÀNG</button>
          <div className="h-4 w-[1px] bg-outline-variant/30"></div>
          <button className="text-sm font-bold text-primary px-4 py-2 rounded-full hover:bg-primary-container/10 transition-all">Support</button>
        </div>
      </header>

      <main className="flex min-h-screen pt-20 md:pt-0">
        {/* Left Side: Product Showcase (60%) */}
        <section className="hidden md:flex md:w-3/5 relative overflow-hidden px-12 py-12 lg:px-20 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_26%),radial-gradient(circle_at_78%_18%,rgba(168,85,247,0.24),transparent_28%),linear-gradient(135deg,#070b1f_0%,#15153a_42%,#2f1450_100%)] text-white">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(124,58,237,0.78)_0%,rgba(30,27,75,0.9)_52%,rgba(9,11,27,0.96)_100%)]" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="absolute left-14 top-24 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-16 right-10 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl" />
          <div className="absolute right-16 top-20 h-32 w-32 rounded-full border border-white/10" />
          <div className="absolute bottom-24 left-10 h-px w-48 bg-gradient-to-r from-transparent via-white/35 to-transparent" />

          <div className="relative z-10 flex h-full w-full flex-col justify-between">
            <div className="max-w-xl">
              <div className="space-y-6 pt-8 lg:pt-14">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/15 bg-violet-200/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-violet-100">
                  <Sparkles className="h-4 w-4" />
                  Đỉnh Cao Công Nghệ
                </div>

                <div className="space-y-4">
                  <h2 className="max-w-lg text-4xl font-black leading-tight tracking-tight lg:text-6xl">
                    Công nghệ đỉnh cao, giá cả hợp lý.
                  </h2>
                  <p className="max-w-md text-base leading-8 text-violet-100/85 lg:text-lg">
                    Mua sắm thiết bị công nghệ trong một không gian tinh gọn, hiện đại và an toàn, được tối ưu cho trải nghiệm khách hàng tại Việt Nam.
                  </p>
                </div>

                <div className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 shadow-lg shadow-violet-950/20 backdrop-blur-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-violet-100">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">100% Chính hãng & Bảo mật</p>
                    <p className="text-sm text-violet-100/75">Cam kết xác thực sản phẩm và bảo vệ dữ liệu đăng ký.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between border-t border-white/15 pt-5 text-sm text-violet-100/75">
              <span>© 2026 KC Tech</span>
              <span className="hidden lg:inline">Vietnam Modern Commerce Experience</span>
            </div>
          </div>
        </section>

        {/* Right Side: Authentication Form (40%) */}
        <section className="w-full md:w-2/5 flex items-center justify-center bg-surface p-8 lg:p-16 relative overflow-hidden">
          <div className="w-full max-w-md relative z-10">

            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <header className="mb-12">
                <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight mb-2">Create Account.</h1>
                <p className="text-on-surface-variant font-medium">Join the industrial ecosystem.</p>
              </header>

              {/* Form Register */}
              <form className="space-y-5" onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Tên đăng nhập (Username)</label>
                  <div className="relative group">
                    <input
                      {...registerForm.register('name')}
                      disabled={isRegisterSubmitting}
                      className="w-full bg-surface-container-low border-none rounded-xl py-3.5 px-5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all"
                      placeholder="Ví dụ: myusername123"
                      type="text"
                    />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-primary-container transition-all duration-300 group-focus-within:w-full"></div>
                  </div>
                  {registerForm.formState.errors.name && <p className="text-xs text-error mt-1 ml-1">{registerForm.formState.errors.name.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Email</label>
                  <div className="relative group">
                    <input
                      {...registerForm.register('email')}
                      disabled={isRegisterSubmitting}
                      className="w-full bg-surface-container-low border-none rounded-xl py-3.5 px-5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all"
                      placeholder="name@company.com"
                      type="email"
                    />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-primary-container transition-all duration-300 group-focus-within:w-full"></div>
                  </div>
                  {registerForm.formState.errors.email && <p className="text-xs text-error mt-1 ml-1">{registerForm.formState.errors.email.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Ngày sinh</label>
                  <div className="relative group">
                    <input
                      {...registerForm.register('birthDate')}
                      disabled={isRegisterSubmitting}
                      className="w-full bg-surface-container-low border-none rounded-xl py-3.5 px-5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all"
                      type="date"
                    />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-primary-container transition-all duration-300 group-focus-within:w-full"></div>
                  </div>
                  {registerForm.formState.errors.birthDate && <p className="text-xs text-error mt-1 ml-1">{registerForm.formState.errors.birthDate.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Mật khẩu</label>
                  <div className="relative group">
                    <input
                      {...registerForm.register('password')}
                      disabled={isRegisterSubmitting}
                      className="w-full bg-surface-container-low border-none rounded-xl py-3.5 px-5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all pr-12"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
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
                  {registerForm.formState.errors.password && <p className="text-xs text-error mt-1 ml-1">{registerForm.formState.errors.password.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Xác nhận mật khẩu</label>
                  <div className="relative group">
                    <input
                      {...registerForm.register('confirmPassword')}
                      disabled={isRegisterSubmitting}
                      className="w-full bg-surface-container-low border-none rounded-xl py-3.5 px-5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all pr-12"
                      placeholder="••••••••"
                      type={showConfirmPassword ? "text" : "password"}
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
                  {registerForm.formState.errors.confirmPassword && <p className="text-xs text-error mt-1 ml-1">{registerForm.formState.errors.confirmPassword.message}</p>}
                </div>

                <button
                  disabled={isRegisterSubmitting}
                  className="w-full bg-primary-container text-on-primary-container mt-2 font-headline font-bold py-5 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group disabled:opacity-70 disabled:pointer-events-none"
                  type="submit"
                >
                  {isRegisterSubmitting ? (
                    <><Loader2 className="animate-spin w-5 h-5" /> Đang xử lý...</>
                  ) : (
                    <>Tạo tài khoản</>
                  )}
                </button>

                <p className="text-[11px] text-on-surface-variant text-center mt-4 px-2 leading-relaxed">
                  Bằng việc đăng ký, bạn đồng ý với <button type="button" onClick={() => { }} className="text-[#f97316] font-bold hover:underline">Điều khoản dịch vụ</button> & <button type="button" onClick={() => { }} className="text-[#f97316] font-bold hover:underline">Chính sách bảo mật</button> của <button type="button" onClick={() => navigate('/')} className="text-[#f97316] font-bold hover:underline">KC29 TECHNOLOGY </button>
                </p>

                <div className="mt-8 text-center">
                  <span className="text-on-surface-variant/40 text-sm">Đã có tài khoản? </span>
                  <button
                    onClick={() => navigate(ROUTES.LOGIN)}
                    type="button"
                    className="text-on-surface-variant font-medium hover:text-primary transition-colors"
                  >
                    <span className="text-[#f97316] font-bold">Đăng nhập</span>
                  </button>
                </div>
              </form>
            </motion.div>

          </div>
        </section>
      </main>

      {/* Simple Mobile Footer */}
      <footer className="md:hidden w-full py-12 px-8 flex flex-col items-center gap-4 border-t border-slate-200/10">
        <Link to={ROUTES.HOME} className="text-lg font-bold text-slate-900 font-headline hover:opacity-80 transition-opacity">
          KC29 TECH
        </Link>
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest text-center">SINCE 2021 KC29 TECHNOLOGY . BEYOND TECHNOLOGY.</p>
        <div className="flex gap-6 mt-4">
          <a className="text-[10px] font-bold text-slate-500 hover:text-cyan-400" href="#">Privacy Policy</a>
          <a className="text-[10px] font-bold text-slate-500 hover:text-cyan-400" href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  )
}
