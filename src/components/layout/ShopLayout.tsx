import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  X,
  LogOut,
  MapPin,
  ClipboardList,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { ROUTES } from '@/utils/constants'
import { cn } from '@/lib/utils'


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

  if (!isAuthenticated) {
    return (
      <Link
        to={ROUTES.LOGIN}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-primary transition-colors"
      >
        <User className="h-5 w-5" />
        Đăng nhập
      </Link>
    )
  }

  const displayName = user?.username || user?.name || ''

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-primary transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
          {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
        </div>
        <span className="hidden md:block">{displayName}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-20 w-52 rounded-xl border border-slate-100 bg-white py-1 shadow-xl">
            <MenuItem
              icon={<ClipboardList className="h-4 w-4" />}
              label="Đơn hàng của tôi"
              onClick={() => { navigate(ROUTES.ORDERS); setOpen(false) }}
            />
            <MenuItem
              icon={<MapPin className="h-4 w-4" />}
              label="Địa chỉ giao hàng"
              onClick={() => { navigate(ROUTES.ADDRESSES); setOpen(false) }}
            />
            <MenuItem
              icon={<User className="h-4 w-4" />}
              label="Thông tin tài khoản"
              onClick={() => { navigate(ROUTES.PROFILE); setOpen(false) }}
            />
            <hr className="my-1 border-slate-100" />
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
        'flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-slate-50',
        danger ? 'text-red-600' : 'text-slate-700',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

export function ShopLayout() {
  const { totalCount } = useCartStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      navigate(ROUTES.ADMIN_DASHBOARD, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  return (
    <div className="min-h-screen bg-bg font-body">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="font-heading text-xl font-bold text-slate-900">
            <span className="text-primary">E</span>Commerce
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            <NavItem to={ROUTES.HOME}>Trang chủ</NavItem>
            <NavItem to={ROUTES.PRODUCTS}>Sản phẩm</NavItem>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-primary transition-colors"
              aria-label="Tìm kiếm"
            >
              <Search className="h-5 w-5" />
            </button>

            <Link
              to={ROUTES.CART}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-primary transition-colors"
              aria-label={`Giỏ hàng${totalCount > 0 ? ` (${totalCount} sản phẩm)` : ''}`}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {totalCount > 9 ? '9+' : totalCount}
                </span>
              )}
            </Link>

            <UserMenu />

            {/* Mobile menu toggle */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-white px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-2">
              <NavItem to={ROUTES.HOME}>Trang chủ</NavItem>
              <NavItem to={ROUTES.PRODUCTS}>Sản phẩm</NavItem>
            </nav>
          </div>
        )}
      </header>

      {/* Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border bg-slate-900 py-10 text-slate-400">
        <div className="container mx-auto px-4 text-center text-sm">
          <div className="mb-3 font-heading text-lg font-bold text-white">
            <span className="text-primary">E</span>Commerce
          </div>
          <p>© 2025 ECommerce. Tất cả quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  )
}
