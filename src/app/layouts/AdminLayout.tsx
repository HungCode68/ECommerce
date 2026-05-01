import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/utils/constants'
import { cn } from '@/lib/utils'
import { getInitials } from '@/app/lib/api'

type NavItem = {
  to: string
  label: string
  icon: string
  end?: boolean
}

const SIDEBAR_NAV: NavItem[] = [
  { to: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard', icon: 'dashboard', end: true },
  { to: ROUTES.ADMIN_PRODUCTS, label: 'Sản phẩm', icon: 'inventory_2' },
  { to: ROUTES.ADMIN_CATEGORIES, label: 'Danh mục', icon: 'category' },
  { to: ROUTES.ADMIN_ORDERS, label: 'Đơn hàng', icon: 'receipt_long' },
  { to: ROUTES.ADMIN_COUPONS, label: 'Coupon', icon: 'local_offer' },
  { to: ROUTES.ADMIN_USERS, label: 'Khách hàng', icon: 'group' },
  { to: ROUTES.ADMIN_REVIEWS, label: 'Đánh giá', icon: 'star' },
  { to: ROUTES.ADMIN_SETTINGS, label: 'Cài đặt', icon: 'settings' },
]

const HEADER_NAV = [
  { label: 'Overview', to: ROUTES.ADMIN_DASHBOARD },
  { label: 'Operations', to: ROUTES.ADMIN_ORDERS },
  { label: 'Workflows', to: ROUTES.ADMIN_PRODUCTS },
  { label: 'Compliance', to: ROUTES.ADMIN_SETTINGS },
]

function iconClass(isActive: boolean) {
  return cn(
    'material-symbols-outlined text-[20px] transition-all',
    isActive ? 'text-cyan-600' : 'text-slate-400',
  )
}

export function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const displayName = user?.name?.trim() || user?.username || 'Admin'
  const initials = getInitials(displayName)

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200/15 bg-slate-50 py-6 pr-4">
        <div className="mb-10 px-8">
          <div className="space-y-1">
            <h1 className="font-headline text-lg font-bold text-slate-900">
              Kinetic Admin
            </h1>
            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
              Management Suite
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          {SIDEBAR_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 px-8 py-3 transition-transform hover:translate-x-1',
                  isActive
                    ? 'rounded-r-full bg-cyan-50 font-bold text-cyan-600'
                    : 'text-slate-500 hover:bg-slate-100',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={iconClass(isActive)}
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-6 left-0 right-4">
          <div className="mx-4 rounded-xl bg-surface-container-low p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-500" />
              <p className="text-xs font-bold text-slate-900">System Status: Active</p>
            </div>
            <p className="text-xs leading-5 text-slate-500">
              All modules operating at 100% capacity.
            </p>
          </div>
        </div>
      </aside>

      <div className="ml-64 flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/70 px-8 shadow-sm backdrop-blur-[24px]">
          <div className="flex items-center gap-6">
            <div className="font-black tracking-[0.35em] text-cyan-500">
              KINETIC
            </div>

            <nav className="hidden items-center gap-4 md:flex">
              {HEADER_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === ROUTES.ADMIN_DASHBOARD}
                  className={({ isActive }) =>
                    cn(
                      'text-[10px] font-black uppercase tracking-[0.35em] transition-colors',
                      isActive ? 'text-cyan-500' : 'text-slate-400 hover:text-slate-700',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:text-cyan-500"
              aria-label="Tìm kiếm"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
            </button>

            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:text-cyan-500"
              aria-label="Thông báo"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-white bg-red-500" />
            </button>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-surface-container-highest text-xs font-bold text-slate-700 shadow-sm"
                  aria-label="Tài khoản"
                >
                  {initials}
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Content
                align="end"
                sideOffset={12}
                className="min-w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
              >
                <DropdownMenu.Label className="px-3 py-2 text-sm font-semibold text-slate-900">
                  Xin chào, {displayName}
                </DropdownMenu.Label>
                <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />
                <DropdownMenu.Item
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-600 outline-none transition-colors hover:bg-slate-50 hover:text-slate-900"
                  onSelect={() => navigate(ROUTES.ADMIN_SETTINGS)}
                >
                  Tài khoản
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-red-600 outline-none transition-colors hover:bg-red-50"
                  onSelect={() => logout()}
                >
                  Đăng xuất
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#f7f9fb]">
          <div className="px-8 py-8">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </div>

          <footer className="grid grid-cols-1 gap-12 bg-slate-100 px-12 py-16 md:grid-cols-4">
            <div className="space-y-3">
              <div className="font-headline text-2xl font-black text-slate-900">
                KINETIC
              </div>
              <p className="max-w-xs text-sm leading-6 text-slate-600">
                Hệ thống quản trị cho vận hành, dữ liệu và thương mại điện tử theo thời gian thực.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                Support
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>Tech Support</li>
                <li>Developer API</li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                Company
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>Sustainability</li>
                <li>Global Warranty</li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                Newsletter
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-cyan-500"
                />
                <button
                  type="button"
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-cyan-600"
                >
                  Gửi
                </button>
              </div>
              <p className="text-xs text-slate-500">
                © {new Date().getFullYear()} KINETIC. All rights reserved.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
