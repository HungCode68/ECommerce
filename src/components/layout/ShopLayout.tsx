import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  User,
  Menu,
  X,
  LogOut,
  MapPin,
  ClipboardList,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { categoryApi } from '@/api/category.api'
import { queryKeys } from '@/lib/queryKeys'
import { ROUTES } from '@/utils/constants'
import { cn } from '@/lib/utils'

// Map category name -> Material Symbol icon
function getCategoryIcon(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('điện thoại') || n.includes('phone') || n.includes('smartphone')) return 'smartphone'
  if (n.includes('laptop') || n.includes('máy tính') || n.includes('pc') || n.includes('computer')) return 'laptop'
  if (n.includes('đồng hồ') || n.includes('watch')) return 'watch'
  if (n.includes('tai nghe') || n.includes('headphone') || n.includes('audio')) return 'headphones'
  if (n.includes('máy ảnh') || n.includes('camera')) return 'photo_camera'
  if (n.includes('phụ kiện') || n.includes('accessory')) return 'devices_other'
  if (n.includes('máy tính bảng') || n.includes('tablet') || n.includes('ipad')) return 'tablet'
  if (n.includes('tủ lạnh') || n.includes('refrigerator')) return 'kitchen'
  if (n.includes('máy lạnh') || n.includes('air')) return 'ac_unit'
  if (n.includes('máy giặt') || n.includes('washer')) return 'local_laundry_service'
  if (n.includes('màn hình') || n.includes('monitor') || n.includes('display')) return 'monitor'
  if (n.includes('bàn phím') || n.includes('keyboard')) return 'keyboard'
  if (n.includes('chuột') || n.includes('mouse')) return 'mouse'
  if (n.includes('gaming') || n.includes('game')) return 'sports_esports'
  return 'category'
}


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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: categoryApi.getAll,
    staleTime: 5 * 60 * 1000, // cache 5 minutes
  })

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      navigate(ROUTES.ADMIN_DASHBOARD, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`${ROUTES.PRODUCTS}?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary-container selection:text-white flex flex-col">
      {/* Promotional Top Banner */}
      <div className="w-full bg-primary py-2 px-8 flex justify-center items-center gap-4 text-white font-label text-xs tracking-widest overflow-hidden relative z-50">
        <span className="opacity-80">ƯU ĐÃI ĐỘC QUYỀN TRONG THÁNG: GIẢM 20% CHO CÁC DÒNG LAPTOP KC29 TECH CORE</span>
        <div className="h-1 w-1 bg-white rounded-full"></div>
        <Link to={ROUTES.PRODUCTS} className="font-bold underline decoration-primary-container underline-offset-4 cursor-pointer">MUA NGAY</Link>
      </div>

      {/* Navigation Header */}
      <nav className="absolute top-12 md:top-14 left-1/2 -translate-x-1/2 w-[95%] max-w-screen-2xl z-40 glass-panel shadow-[0_40px_60px_-15px_rgba(0,0,0,0.06)] px-6 lg:px-8 py-3 flex items-center justify-between rounded-2xl border border-white/40">
        <div className="flex items-center gap-8 xl:gap-12">
          <Link to={ROUTES.HOME} className="font-headline text-2xl font-bold tracking-tighter text-on-surface">KC29 TECH</Link>

          <div className="hidden lg:flex items-center gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`${ROUTES.PRODUCTS}?category_id=${cat.id}`}
                className="flex items-center gap-2 font-label text-[11px] font-bold uppercase tracking-widest text-on-surface hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-lg opacity-70">{getCategoryIcon(cat.name)}</span>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          <form onSubmit={handleSearch} className="hidden md:flex bg-surface-container-high/50 items-center px-4 py-2 gap-2 rounded-full focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <span className="material-symbols-outlined text-outline-variant text-xl">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder:text-outline-variant"
              placeholder="Tìm kiếm công nghệ..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="flex items-center gap-4">
            <Link to={ROUTES.CART} className="relative text-on-surface hover:text-primary transition-transform active:scale-95 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
              {totalCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                  {totalCount > 9 ? '9+' : totalCount}
                </span>
              )}
            </Link>

            <UserMenu />

            {/* Mobile menu toggle */}
            <button
              className="flex items-center justify-center text-on-surface hover:text-primary lg:hidden transition-transform active:scale-95"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <span className="material-symbols-outlined text-[24px]">close</span>
              ) : (
                <span className="material-symbols-outlined text-[24px]">menu</span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 mt-4 w-full bg-surface-container-lowest/95 backdrop-blur-xl rounded-2xl shadow-xl lg:hidden p-4 flex flex-col gap-4 border border-outline-variant/20">
            <form onSubmit={handleSearch} className="flex bg-surface-container-high/50 items-center px-4 py-3 gap-2 rounded-xl">
              <span className="material-symbols-outlined text-outline-variant text-xl">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-outline-variant"
                placeholder="Tìm kiếm công nghệ..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <div className="flex flex-col gap-2">
              <NavItem to={ROUTES.HOME}>Trang chủ</NavItem>
              <NavItem to={ROUTES.PRODUCTS}>Tất cả sản phẩm</NavItem>
              {categories.map((cat) => (
                <NavItem key={cat.id} to={`${ROUTES.PRODUCTS}?category_id=${cat.id}`}>{cat.name}</NavItem>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 pt-36">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full py-16 px-8 mt-auto bg-surface-container-low border-t border-outline-variant/10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-screen-2xl mx-auto">
          <div className="flex flex-col gap-6">
            <span className="font-headline text-2xl font-bold text-on-surface tracking-tighter">KC29 TECH</span>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
              Được thiết kế để dẫn đầu kỷ nguyên công nghệ số tiếp theo. Chúng tôi mang đến sự chính xác, hiệu năng và thẩm mỹ tương lai trong từng sản phẩm.
            </p>
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors">public</span>
              <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors">send</span>
              <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors">share</span>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-headline font-bold text-sm uppercase tracking-widest text-on-surface">Khám phá</h4>
            <Link to={ROUTES.PRODUCTS} className="font-body text-sm text-on-surface-variant hover:text-primary transition-all">Sản phẩm mới</Link>
            <Link to="#" className="font-body text-sm text-on-surface-variant hover:text-primary transition-all">Giải pháp doanh nghiệp</Link>
            <Link to="#" className="font-body text-sm text-on-surface-variant hover:text-primary transition-all">KC29 TECH Lab</Link>
            <Link to="#" className="font-body text-sm text-on-surface-variant hover:text-primary transition-all">Cộng đồng</Link>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-headline font-bold text-sm uppercase tracking-widest text-on-surface">Hỗ trợ</h4>
            <Link to="#" className="font-body text-sm text-on-surface-variant hover:text-primary transition-all">Trung tâm bảo hành</Link>
            <Link to="#" className="font-body text-sm text-on-surface-variant hover:text-primary transition-all">Chính sách vận chuyển</Link>
            <Link to="#" className="font-body text-sm text-on-surface-variant hover:text-primary transition-all">Câu hỏi thường gặp</Link>
            <Link to="#" className="font-body text-sm text-on-surface-variant hover:text-primary transition-all">Liên hệ</Link>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className="font-headline font-bold text-sm uppercase tracking-widest text-on-surface">Bản tin công nghệ</h4>
            <p className="font-body text-sm text-on-surface-variant">Đăng ký để nhận thông tin về các đột phá công nghệ mới nhất.</p>
            <div className="flex border-b border-outline-variant pb-2 focus-within:border-primary transition-colors">
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-full font-body placeholder:text-outline-variant/50 outline-none"
                placeholder="Email của bạn"
                type="email"
              />
              <button className="material-symbols-outlined text-primary hover:text-primary-container transition-colors">arrow_forward</button>
            </div>
          </div>
        </div>
        <div className="max-w-screen-2xl mx-auto mt-16 pt-8 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="font-body text-[10px] text-on-surface-variant tracking-widest uppercase opacity-60">© 2024 KC29 TECH. ENGINEERED FOR THE NEXT ERA.</p>
          <div className="flex gap-8">
            <Link to="#" className="font-body text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors">Quyền riêng tư</Link>
            <Link to="#" className="font-body text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors">Điều khoản sử dụng</Link>
            <Link to="#" className="font-body text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors">Bản đồ trang</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
