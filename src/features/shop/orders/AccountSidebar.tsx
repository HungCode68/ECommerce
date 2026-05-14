import { Bell, LogOut, MapPin, Menu, ShoppingBag, User2, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { User } from '@/types/auth.types'
import { ROUTES } from '@/utils/constants'
import { cn } from '@/lib/utils'

type AccountSidebarProps = {
  user: User | null
  open: boolean
  onToggle: () => void
  onClose: () => void
  onLogout: () => void
}

function SidebarLink({
  to,
  icon,
  label,
  onClick,
}: {
  to: string
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors',
          isActive
            ? 'bg-[#7c3aed] text-[#ede0ff]'
            : 'text-[#4a4455] hover:bg-[#f6f3f2]',
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}

export function AccountSidebar({
  user,
  open,
  onToggle,
  onClose,
  onLogout,
}: AccountSidebarProps) {
  const displayName = user?.name || user?.username || 'Khách hàng'
  const subtitle = user?.email || 'Tài khoản thành viên'

  return (
    <aside className="md:col-span-3">
      <button
        type="button"
        onClick={onToggle}
        className="mb-4 flex w-full items-center justify-between rounded-2xl border border-[#ccc3d8] bg-white px-4 py-3 text-left shadow-sm md:hidden"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d2bbff] text-[#630ed4]">
            <User2 className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-[#1c1b1b]">{displayName}</span>
            <span className="block text-xs text-[#7b7487]">Menu tài khoản</span>
          </span>
        </span>
        {open ? <X className="h-4 w-4 text-[#4a4455]" /> : <Menu className="h-4 w-4 text-[#4a4455]" />}
      </button>

      <div className={cn('space-y-4', open ? 'block' : 'hidden md:block')}>
        <div className="flex items-center gap-3 rounded-2xl border border-[#ccc3d8] bg-white p-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d2bbff] text-[#630ed4]">
            <User2 className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-[#1c1b1b]">{displayName}</p>
            <p className="truncate text-xs text-[#7b7487]">{subtitle}</p>
          </div>
        </div>

        <nav className="overflow-hidden rounded-2xl border border-[#ccc3d8] bg-white shadow-sm">
          <SidebarLink
            to={ROUTES.PROFILE}
            icon={<User2 className="h-4 w-4" />}
            label="Tài khoản"
            onClick={onClose}
          />
          <SidebarLink
            to={ROUTES.ORDERS}
            icon={<ShoppingBag className="h-4 w-4" />}
            label="Đơn hàng"
            onClick={onClose}
          />
          <SidebarLink
            to={ROUTES.ADDRESSES}
            icon={<MapPin className="h-4 w-4" />}
            label="Địa chỉ"
            onClick={onClose}
          />
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-[#4a4455] transition-colors hover:bg-[#f6f3f2]"
          >
            <Bell className="h-4 w-4" />
            <span>Thông báo</span>
          </button>
          <div className="border-t border-[#e5e2e1]" />
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-[#ba1a1a] transition-colors hover:bg-[#fff1f0]"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </button>
        </nav>
      </div>
    </aside>
  )
}
