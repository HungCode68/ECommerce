import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { LoginForm } from '@/features/auth/LoginForm'
import { GoogleLoginButton } from '@/features/auth/GoogleLoginButton'
import { RegisterForm } from '@/features/auth/RegisterForm'
import { ROUTES } from '@/utils/constants'
import { cn } from '@/lib/utils'

export default function AuthPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'login' | 'register'>('login')

  const handleSocialClick = (e: React.MouseEvent) => {
    e.preventDefault()
    toast.info('Tính năng đang phát triển')
  }

  return (
    <div className="auth-theme dark bg-surface font-body text-on-surface selection:bg-primary/30 min-h-screen relative overflow-x-hidden flex flex-col">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <img 
          className="w-full h-full object-cover opacity-20 grayscale brightness-50" 
          alt="Abstract cinematic 3D render of a futuristic motherboard with glowing cyan circuitry lines" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQYBIviEUwGnYVmk5W0Fd_HGGb_H4AgPvPyE4hhRFBXLbC8D3ToK82TPPl4Me0SYR27qCraXscyvD1iBkOXfQGEzeNIr34xnZhkA34VBx660PsCNipI6ZogE4_PHefGhNalsRZU_GnrOJUg1_TBuy-076V0spg16Lqze-2GVKuI8pK2WNF5plmwvwGNwzPSY_ONlvnXaN-BSvfIeZBTB176afe1eiicC6OD_K4dslwy6XwpOeHQvbbPp6rorS6CHA8m2UvFKlPorpu" 
        />
        <div className="absolute inset-0 tech-grid"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-surface/80"></div>
      </div>

      {/* Central Authentication Canvas */}
      <main className="relative z-10 flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-[480px]">
          {/* Brand Anchor */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-primary-container/20 rounded-lg flex items-center justify-center mb-4 border border-primary/20">
              <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                storefront
              </span>
            </div>
            <h1 className="font-headline text-4xl font-black text-primary tracking-tighter antialiased">
              SHOPVN
            </h1>
            <p className="text-on-surface-variant font-medium tracking-widest text-xs uppercase mt-2">
              Hệ thống mua sắm thông minh
            </p>
          </div>

          {/* Auth Container */}
          <div className="bg-surface-container-low/60 backdrop-blur-[32px] border border-outline-variant/20 shadow-[0_24px_48px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Custom Tabs */}
            <div className="flex border-b border-outline-variant/10">
              <button 
                onClick={() => setTab('login')}
                className={cn(
                  "flex-1 py-5 text-sm font-headline font-bold tracking-wider uppercase transition-colors",
                  tab === 'login' 
                    ? "text-primary border-b-2 border-primary bg-surface-container-high/40"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/20"
                )}
              >
                Đăng nhập
              </button>
              <button 
                onClick={() => setTab('register')}
                className={cn(
                  "flex-1 py-5 text-sm font-headline font-bold tracking-wider uppercase transition-all",
                  tab === 'register'
                    ? "text-primary border-b-2 border-primary bg-surface-container-high/40"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/20"
                )}
              >
                Đăng ký
              </button>
            </div>

            <div className="p-8 md:p-10 overflow-hidden relative">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: tab === 'login' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: tab === 'login' ? 20 : -20 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {tab === 'login' ? (
                    <LoginForm />
                  ) : (
                    <RegisterForm onSuccess={() => setTab('login')} />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Divider */}
              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                  <span className="px-4 bg-[#11182a] text-outline">Truy cập nhanh</span>
                </div>
              </div>

              {/* Social Auth */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-high border border-outline-variant/10 p-2">
                  <GoogleLoginButton />
                </div>
                <button 
                  onClick={handleSocialClick}
                  className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/10 transition-all group"
                >
                  <svg
                    className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-all"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="#1877F2"
                  >
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                  </svg>
                  <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface">
                    Facebook
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-8 flex justify-center">
            <button 
              onClick={() => navigate(ROUTES.HOME)}
              className="group flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span className="text-xs font-bold uppercase tracking-widest">
                Trở về trang chủ
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Segment */}
      <footer className="relative z-10 w-full py-8 px-8 border-t border-outline-variant/5 bg-surface-container-lowest/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-lg font-black text-slate-200 font-headline tracking-tighter">
            © 2024 SHOPVN. MUA SẮM THÔNG MINH.
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a className="font-label text-sm tracking-wide text-slate-500 hover:text-primary transition-all duration-200" href="#">
              Hỗ trợ
            </a>
            <a className="font-label text-sm tracking-wide text-slate-500 hover:text-primary transition-all duration-200" href="#">
              Chính sách
            </a>
            <a className="font-label text-sm tracking-wide text-slate-500 hover:text-primary transition-all duration-200" href="#">
              Liên hệ
            </a>
            <a className="font-label text-sm tracking-wide text-slate-500 hover:text-primary transition-all duration-200" href="#">
              Về chúng tôi
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
