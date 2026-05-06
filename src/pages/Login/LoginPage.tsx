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
import { GoogleLoginButton } from '@/features/auth/GoogleLoginButton'
import { ROUTES } from '@/utils/constants'

const loginSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập tối thiểu 3 ký tự'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  remember: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>


export function LoginPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.HOME, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', remember: false }
  })


  const handleSocialClick = () => {
    toast.info('Tính năng đang phát triển')
  }

  const { mutate: loginAccount, isPending: isLoginSubmitting } = useMutation({
    mutationFn: (data: LoginFormData) => authApi.login({ identifier: data.username, password: data.password }),
    onSuccess: (response) => {
      setAuth(response.user, response.access_token, response.refresh_token)
      toast.success('Đăng nhập thành công!')
      // Redirect happens in useEffect
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const apiErrors = error.response?.data?.errors
        if ((status === 401 || status === 400) && apiErrors) {
          Object.entries(apiErrors).forEach(([field, msg]) => {
            const fieldLower = field.toLowerCase()
            if (fieldLower === 'identifier' || fieldLower === 'username') {
              loginForm.setError('username', { message: msg as string })
            } else if (fieldLower === 'password') {
              loginForm.setError('password', { message: msg as string })
            }
          })
        } else if (status === 401) {
          toast.error('Tên đăng nhập hoặc mật khẩu không đúng')
        } else {
          toast.error(error.response?.data?.message || 'Có lỗi xảy ra, thử lại sau')
        }
      } else {
        toast.error('Có lỗi xảy ra, thử lại sau')
      }
    }
  })

  const onLoginSubmit = (data: LoginFormData) => loginAccount(data)

  return (
    <div className="light bg-background text-on-background min-h-screen overflow-x-hidden font-body">
      {/* TopNavBar */}
      <header className="absolute top-0 w-full z-50 flex justify-between items-center px-8 h-20 max-w-full bg-transparent">
        <Link to={ROUTES.HOME} className="text-2xl font-black tracking-tighter text-cyan-600 font-headline hover:opacity-80 transition-opacity">
          KC29 TECH
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
                KC29 <span className="text-primary-container">TECH</span><br />
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
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <header className="mb-12">
                <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight mb-2">Chào Mừng Quay Lại</h1>
                <p className="text-on-surface-variant font-medium">Nền Tảng Bán Hàng Điện Tử Số 1 Việt Nam</p>
              </header>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <GoogleLoginButton className="rounded-xl">
                  <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 hover:bg-surface-bright transition-all group">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                    </svg>
                    <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Google</span>
                  </div>
                </GoogleLoginButton>
                <button onClick={handleSocialClick} type="button" className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 hover:bg-surface-bright transition-all group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Facebook</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/30"></div>
                </div>
                <span className="relative bg-surface px-4 text-[10px] font-bold text-outline uppercase tracking-widest">HOẶC</span>
              </div>

              {/* Form Login */}
              <form className="space-y-6" onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block ml-1">TÊN ĐĂNG NHẬP</label>
                  <div className="relative group">
                    <input
                      {...loginForm.register('username')}
                      disabled={isLoginSubmitting}
                      className="w-full bg-surface-container-low border-none rounded-xl py-4 px-5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all"

                    />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-primary-container transition-all duration-300 group-focus-within:w-full"></div>
                  </div>
                  {loginForm.formState.errors.username && <p className="text-xs text-error mt-1 ml-1">{loginForm.formState.errors.username.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Mật khẩu</label>
                    <button type="button" onClick={handleSocialClick} className="text-xs font-bold text-primary hover:text-cyan-600 transition-colors">Quên mật khẩu?</button>
                  </div>
                  <div className="relative group">
                    <input
                      {...loginForm.register('password')}
                      disabled={isLoginSubmitting}
                      className="w-full bg-surface-container-low border-none rounded-xl py-4 px-5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all pr-12"
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
                  {loginForm.formState.errors.password && <p className="text-xs text-error mt-1 ml-1">{loginForm.formState.errors.password.message}</p>}
                </div>

                <div className="flex items-center gap-3 ml-1">
                  <input
                    {...loginForm.register('remember')}
                    disabled={isLoginSubmitting}
                    className="w-5 h-5 rounded border-outline-variant/50 text-primary-container focus:ring-primary-container cursor-pointer bg-surface-container-low"
                    id="remember"
                    type="checkbox"
                  />
                  <label className="text-sm font-medium text-on-surface-variant cursor-pointer" htmlFor="remember">Ghi nhớ đăng nhập</label>
                </div>

                <button
                  disabled={isLoginSubmitting}
                  className="w-full bg-primary-container text-on-primary-container font-headline font-bold py-5 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group disabled:opacity-70 disabled:pointer-events-none"
                  type="submit"
                >
                  {isLoginSubmitting ? (
                    <><Loader2 className="animate-spin w-5 h-5" /> Đang xử lý...</>
                  ) : (
                    <>
                      Đăng nhập vào KC29 Tech
                      <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-on-surface-variant text-center mt-4 px-2 leading-relaxed">
                  Bằng việc đăng nhập, bạn đồng ý với <button type="button" onClick={() => { }} className="text-[#f97316] font-bold hover:underline">Điều khoản dịch vụ</button> &
                  <button type="button" onClick={() => { }} className="text-[#f97316] font-bold hover:underline">Chính sách bảo mật</button> của KC29 Tech
                </p>

                <div className="mt-8 text-center">
                  <span className="text-on-surface-variant/40 text-sm">Chưa có tài khoản? </span>
                  <button
                    onClick={() => navigate(ROUTES.REGISTER)}
                    type="button"
                    className="text-on-surface-variant font-medium hover:text-primary transition-colors"
                  >
                    <span className="text-[#f97316] font-bold">Đăng ký ngay</span>
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
