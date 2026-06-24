import { startTransition, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  User,
  LogOut,
  MapPin,
  ClipboardList,
  LayoutDashboard,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { categoryApi } from '@/api/category.api'
import { queryKeys } from '@/lib/queryKeys'
import { ROUTES } from '@/utils/constants'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/shared/NotificationBell'
import { SupportWidget } from '@/components/shared/SupportWidget'
import kcTechLogo from '@/assets/kc-tech-logo.svg'


function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'text-sm font-medium transition-colors hover:text-primary',
          isActive ? 'text-primary' : 'text-slate-700',
        )
      }
    >
      {children}
    </NavLink>
  )
}

function UserMenu() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const goTo = (path: string) => {
    setOpen(false)
    startTransition(() => {
      navigate(path)
    })
  }

  if (!isAuthenticated) {
    return (
      <Link
        to={ROUTES.LOGIN}
        className="flex items-center gap-1.5 text-sm font-bold text-on-surface hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[24px]">account_circle</span>
        <span className="hidden md:inline">Đăng nhập</span>
      </Link>
    )
  }

  const displayName = user?.username || user?.name || ''

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-on-surface hover:text-primary transition-colors active:scale-95"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-bold text-xs shadow-md">
          {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
        </div>
        <span className="hidden md:block font-bold">{displayName}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-20 w-52 rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-2 shadow-xl">
            {user?.role === 'admin' && (
              <>
                <MenuItem
                  icon={<LayoutDashboard className="h-4 w-4" />}
                  label="Trang quản trị"
                  onClick={() => goTo(ROUTES.ADMIN_DASHBOARD)}
                />
                <hr className="my-2 border-outline-variant/20" />
              </>
            )}
            <MenuItem
              icon={<ClipboardList className="h-4 w-4" />}
              label="Đơn hàng của tôi"
              onClick={() => goTo(ROUTES.ORDERS)}
            />
            <MenuItem
              icon={<MapPin className="h-4 w-4" />}
              label="Địa chỉ giao hàng"
              onClick={() => goTo(ROUTES.ADDRESSES)}
            />
            <MenuItem
              icon={<User className="h-4 w-4" />}
              label="Thông tin tài khoản"
              onClick={() => goTo(ROUTES.PROFILE)}
            />
            <hr className="my-2 border-outline-variant/20" />
            <MenuItem
              icon={<LogOut className="h-4 w-4" />}
              label="Đăng xuất"
              onClick={() => { logout(); setOpen(false) }}
              danger
            />
          </div>
        </>
      )}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-container-low font-medium',
        danger ? 'text-error hover:bg-error-container/30' : 'text-on-surface',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

export function ShopLayout() {
  const { totalCount } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const isHomePage = location.pathname === ROUTES.HOME

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: categoryApi.getAll,
    staleTime: 5 * 60 * 1000, // cache 5 minutes
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`${ROUTES.PRODUCTS}?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setMobileMenuOpen(false)
    }
  }

  const homeCategories = categories.slice(0, 5)
  const homePrimaryCategory = homeCategories[0]

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary-container selection:text-white flex flex-col">
      <header className="sticky top-0 z-40 border-b border-[#e5e2e1] bg-[#fcf9f8]/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col px-4 py-2 md:px-6">
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#ccc3d8] text-[#1c1b1b] lg:hidden"
                onClick={() => setMobileMenuOpen((value) => !value)}
                aria-label="Menu"
              >
                <span className="material-symbols-outlined text-[22px]">
                  {mobileMenuOpen ? 'close' : 'menu'}
                </span>
              </button>
              <Link to={ROUTES.HOME} className="flex items-center">
                <img src={kcTechLogo} alt="KC Tech" className="h-9 w-auto md:h-10" />
              </Link>
            </div>

            <form
              onSubmit={handleSearch}
              className="hidden max-w-xl flex-1 items-center rounded-xl bg-white px-4 py-2 md:flex"
            >
              <input
                className="w-full border-none bg-transparent text-sm text-[#1c1b1b] placeholder:text-[#7b7487] focus:ring-0"
                placeholder="Bạn cần tìm sản phẩm gì?"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="text-[#4a4455]" aria-label="Tìm kiếm">
                <span className="material-symbols-outlined text-[22px]">search</span>
              </button>
            </form>

            <div className="flex items-center gap-4 text-[#630ed4]">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#ccc3d8] text-[#1c1b1b] md:hidden"
                aria-label="Mở tìm kiếm"
              >
                <span className="material-symbols-outlined text-[22px]">search</span>
              </button>

              <Link to={ROUTES.CART} className="relative flex items-center gap-1 text-sm font-semibold text-[#1c1b1b] transition-colors hover:text-[#630ed4]">
                <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
                <span className="hidden md:inline">Giỏ hàng</span>
                {totalCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#630ed4] px-1 text-[10px] font-bold text-white">
                    {totalCount > 9 ? '9+' : totalCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div className="flex items-center gap-4 shrink-0">
                  <NotificationBell />
                  <UserMenu />
                </div>
              ) : (
                <Link to={ROUTES.LOGIN} className="flex items-center gap-1 text-sm font-semibold text-[#1c1b1b] transition-colors hover:text-[#630ed4]">
                  <span className="material-symbols-outlined text-[22px]">person</span>
                  <span className="hidden md:inline">Đăng nhập</span>
                </Link>
              )}
            </div>
          </div>

          <nav className="hidden items-center gap-6 overflow-x-auto py-2 text-sm lg:flex">
            <Link to={ROUTES.HOME} className={cn('pb-1 font-medium transition-colors', isHomePage ? 'border-b-2 border-[#630ed4] text-[#630ed4]' : 'text-[#4a4455] hover:text-[#630ed4]')}>
              Trang chủ
            </Link>
            {homeCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/${cat.slug}`}
                className="whitespace-nowrap text-[#4a4455] transition-colors hover:text-[#630ed4]"
              >
                {cat.name}
              </Link>
            ))}
            {!homePrimaryCategory && (
              <Link
                to={ROUTES.PRODUCTS}
                className="whitespace-nowrap text-[#4a4455] transition-colors hover:text-[#630ed4]"
              >
                Sản phẩm
              </Link>
            )}
          </nav>

          {mobileMenuOpen && (
            <div className="mt-2 flex flex-col gap-4 border-t border-[#e5e2e1] py-4 lg:hidden">
              <form onSubmit={handleSearch} className="flex items-center rounded-xl bg-white px-4 py-3">
                <input
                  className="w-full border-none bg-transparent text-sm text-[#1c1b1b] placeholder:text-[#7b7487] focus:ring-0"
                  placeholder="Bạn cần tìm sản phẩm gì?"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="text-[#4a4455]" aria-label="Tìm kiếm">
                  <span className="material-symbols-outlined text-[22px]">search</span>
                </button>
              </form>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <NavItem to={ROUTES.HOME}>Trang chủ</NavItem>
                <NavItem to={ROUTES.PRODUCTS}>Tất cả sản phẩm</NavItem>
                {categories.map((cat) => (
                  <NavItem key={cat.id} to={`/${cat.slug}`}>{cat.name}</NavItem>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className={cn('flex-1', isHomePage ? 'pt-0' : 'pt-4 md:pt-5')}>
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-[#e5e2e1] bg-[#f0eded]">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-4 py-8 md:grid-cols-4 md:px-6">
          <div className="space-y-4">
            <img src={kcTechLogo} alt="KC Tech" className="h-9 w-auto" />
            <p className="text-sm leading-6 text-[#4a4455]">
              KC Tech là hệ thống bán lẻ thiết bị công nghệ chính hãng, uy tín hàng đầu Việt Nam. Cam kết chất lượng và dịch vụ tận tâm.
            </p>
            <div className="flex items-center gap-4">
              <img src="/socialNetwork/facebook.png" alt="Facebook" className="h-8 w-8 cursor-pointer object-contain" />
              <img src="/socialNetwork/insta.png" alt="Instagram" className="h-8 w-8 cursor-pointer object-contain" />
              <img src="/socialNetwork/youtube.png" alt="YouTube" className="h-8 w-8 cursor-pointer object-contain" />
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#1c1b1b]">Về chúng tôi</h3>
            <div className="space-y-2 text-sm text-[#4a4455]">
              <Link to="#" className="block hover:text-[#630ed4]">Giới thiệu</Link>
              <Link to="#" className="block hover:text-[#630ed4]">Tin tức</Link>
              <Link to="#" className="block hover:text-[#630ed4]">Tuyển dụng</Link>
              <Link to="#" className="block hover:text-[#630ed4]">Liên hệ</Link>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#1c1b1b]">Chính sách</h3>
            <div className="space-y-2 text-sm text-[#4a4455]">
              <Link to="#" className="block hover:text-[#630ed4]">Chính sách bảo hành</Link>
              <Link to="#" className="block hover:text-[#630ed4]">Chính sách đổi trả</Link>
              <Link to="#" className="block hover:text-[#630ed4]">Chính sách vận chuyển</Link>
              <a href="/CSBM.pdf" target="_blank" rel="noopener noreferrer" className="block hover:text-[#630ed4]">Chính sách bảo mật</a>
              <a href="/DKSD.pdf" target="_blank" rel="noopener noreferrer" className="block hover:text-[#630ed4]">Điều khoản sử dụng</a>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#1c1b1b]">Liên hệ</h3>
            <div className="space-y-2 text-sm text-[#4a4455]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#630ed4]">call</span>
                <span>1900 1234</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#630ed4]">mail</span>
                <span>hotro@kctech.vn</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#630ed4]">schedule</span>
                <span>08:00 - 22:00</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 border-t border-[#e5e2e1] px-4 py-4 text-sm text-[#4a4455] md:flex-row md:px-6">
          <div>© 2026 KC TECH. Mọi bản quyền liên quan đến chúng tôi đã được đăng ký.</div>
          <div className="flex items-center gap-4">
            <img src="/payment/visa.png" alt="Visa" className="h-7 w-auto object-contain md:h-8" />
            <img src="/payment/atm.png" alt="ATM" className="h-7 w-auto object-contain md:h-8" />
            <img src="/payment/momo.png" alt="MoMo" className="h-7 w-auto object-contain md:h-8" />
          </div>
        </div>
      </footer>
      <SupportWidget />
    </div>
  )
}
