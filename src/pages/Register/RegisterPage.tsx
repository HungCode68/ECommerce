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

import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth.api'
import { ROUTES } from '@/utils/constants'

const registerSchema = z.object({
  name: z.string()
    .min(3, 'Tên đăng nhập tối thiểu 3 ký tự')
    .max(50, 'Tên đăng nhập tối đa 50 ký tự')
    .regex(/^[a-zA-Z0-9]+$/, 'Tên đăng nhập chỉ được chứa chữ cái và số (không khoảng cách)'),
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
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
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
  })


  const { mutate: registerAccount, isPending: isRegisterSubmitting } = useMutation({
    mutationFn: (data: RegisterFormData) => authApi.register({ username: data.name, email: data.email, password: data.password }),
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
        <Link to={ROUTES.HOME} className="text-2xl font-black tracking-tighter text-cyan-600 font-headline hover:opacity-80 transition-opacity">
          KC29 TECHNOLOGY
        </Link>
        <div className="hidden md:flex gap-6 items-center">
          <button className="text-xs font-medium text-slate-500 uppercase tracking-widest">HƯỚNG DẪN MUA HÀNG</button>
          <div className="h-4 w-[1px] bg-outline-variant/30"></div>
          <button className="text-sm font-bold text-primary px-4 py-2 rounded-full hover:bg-primary-container/10 transition-all">Support</button>
        </div>
      </header>

      <main className="flex min-h-screen pt-20 md:pt-0">
        {/* Left Side: Product Showcase (60%) */}
        <section className="hidden md:flex md:w-3/5 bg-slate-950 relative overflow-hidden flex-col justify-between py-12 px-12 lg:px-24">
          {/* Background Decorative */}
          <div className="absolute inset-0 kinetic-gradient-glow pointer-events-none z-0"></div>
          <div className="absolute top-1/4 left-0 w-full h-[1px] circuit-line opacity-20 pointer-events-none z-0"></div>
          <div className="absolute top-3/4 left-0 w-full h-[1px] circuit-line opacity-20 pointer-events-none z-0"></div>
          <div className="absolute top-1/4 left-1/4 w-[1px] h-1/2 bg-primary-container/20 pointer-events-none z-0"></div>

          {/* Main Content: Flexible Space */}
          <div className="flex-1 flex flex-col justify-center items-center w-full min-h-0 relative z-10 my-8">
            {/* Image wraps in shrinkable flex container */}
            <div className="relative group w-full flex justify-center flex-1 min-h-0 items-center">
              <img
                alt="Premium tech interface"
                className="w-auto h-full max-h-[50vh] object-contain drop-shadow-[0_0_50px_rgba(6,182,212,0.3)] transform transition-transform duration-700 group-hover:scale-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0MFktjj7l_oOAbis29Uw3TpzQZkUB2sJrCATJ9OvOwqnuO3wv6XHtfIjmNusEwrtijU_aUHXgJoTUtDCTbuccYDr55eDCqtVxhmYhxsGdUe5Xp8lOGp6-INS_l-YsqqgoUCrrlcJK5csf4l8XMGiGy1nki6EUZiqeTkN6PG9qQM5Gov4W3_Ys6CZJAzoDbtJesmq72jVCnTeptmw-2XOAjmXNz4x1C-UzEooHlxW2GBFo88zRwuE5_gra096OEPTmiyRIG28h9EBC"
              />
            </div>

            <div className="mt-8 text-center shrink-0">
              <h2 className="font-headline text-3xl lg:text-5xl xl:text-7xl font-bold text-white tracking-tighter leading-none mb-4">
                KC29 <span className="text-primary-container">TECHNOLOGY</span><br />
              </h2>
              <p className="text-slate-400 font-body max-w-sm lg:max-w-md mx-auto text-sm lg:text-base">
                Công nghệ đỉnh cao, giá cả hợp lý.
              </p>
            </div>
          </div>

          {/* Footer Area: Placed naturally at the bottom, not absolute */}
          <div className="w-full shrink-0 flex flex-row items-end justify-between relative z-10">
            <div className="flex items-center gap-4">

              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hidden lg:inline-block">Được hơn 4.000 khách hàng sử dụng</span>
            </div>

            <div className="flex flex-col items-end gap-2 opacity-30">
              <div className="h-1 w-20 bg-primary-container/50"></div>
              <div className="h-1 w-12 bg-primary-container/30"></div>
              <span className="text-[8px] font-black font-headline text-white uppercase tracking-[0.5em]">Uy Tín Tạo Thương Hiệu</span>
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
