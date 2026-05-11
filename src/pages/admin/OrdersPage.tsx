import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminOrderApi } from '@/api/admin/adminOrder.api'
import { adminCategoryApi } from '@/api/admin/adminCategory.api'
import { queryKeys } from '@/lib/queryKeys'
import { Pagination } from '@/components/shared/Pagination'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDateTime } from '@/utils/formatters/format'
import { ROUTES } from '@/utils/constants'
import { usePagination } from '@/hooks/usePagination'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types/order.types'
import { getInitials, getAvatarColor } from '@/utils/adminDashboard'

const STATUS_OPTIONS: { label: string; value: OrderStatus | ''; icon: string }[] = [
  { label: 'Tất cả trạng thái', value: '', icon: 'apps' },
  { label: 'Đang chờ xử lý', value: 'pending', icon: 'hourglass_empty' },
  { label: 'Đã xác nhận', value: 'confirmed', icon: 'check_circle' },
  { label: 'Đang giao hàng', value: 'shipping', icon: 'local_shipping' },
  { label: 'Đã giao', value: 'delivered', icon: 'task_alt' },
  { label: 'Đã hủy', value: 'cancelled', icon: 'cancel' },
]

const STATUS_MAP: Record<OrderStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending: {
    label: 'Pending',
    bg: 'bg-tertiary-container/10',
    text: 'text-tertiary',
    dot: 'bg-tertiary',
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    dot: 'bg-blue-500',
  },
  shipping: {
    label: 'Shipping',
    bg: 'bg-primary-container/10',
    text: 'text-primary',
    dot: 'bg-primary-container',
  },
  delivered: {
    label: 'Delivered',
    bg: 'bg-green-500/10',
    text: 'text-green-600',
    dot: 'bg-green-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-error/10',
    text: 'text-error',
    dot: 'bg-error',
  },
}

export function OrdersPage() {
  const navigate = useNavigate()
  const { page, limit, totalPages, goToPage } = usePagination()
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)

  // Fetch categories for filter dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['admin', 'categories', 'all'],
    queryFn: () => adminCategoryApi.getList({ page: 1, limit: 100 }),
  })
  const categories = categoriesData?.categories ?? []

  // Fetch total orders count (all statuses)
  const { data: allOrdersData } = useQuery({
    queryKey: queryKeys.admin.orders.list({ page: 1, limit: 1 }),
    queryFn: () => adminOrderApi.getList({ page: 1, limit: 1 }),
  })

  // Fetch pending orders count
  const { data: pendingOrdersData } = useQuery({
    queryKey: queryKeys.admin.orders.list({ page: 1, limit: 1, status: 'pending' as OrderStatus }),
    queryFn: () => adminOrderApi.getList({ page: 1, limit: 1, status: 'pending' as OrderStatus }),
  })

  // Derive KPI values from live order data
  const totalOrdersCount = allOrdersData?.pagination?.total ?? (allOrdersData?.data as any)?.total ?? 0
  const pendingOrdersCount = pendingOrdersData?.pagination?.total ?? (pendingOrdersData?.data as any)?.total ?? 0

  const { data: ordersData, isLoading } = useQuery({
    queryKey: queryKeys.admin.orders.list({ page, limit, status, category_id: categoryId }),
    queryFn: () => adminOrderApi.getList({ 
      page, 
      limit, 
      status: status as OrderStatus || undefined,
      q: searchTerm || undefined,
      category_id: categoryId,
    }),
  })

  // Defensive extraction of orders and total
  const orders: Order[] = Array.isArray(ordersData?.data) 
    ? ordersData.data 
    : (ordersData?.data as any)?.orders ?? []
    
  const total = ordersData?.pagination?.total 
    ?? (ordersData?.data as any)?.total 
    ?? 0
    
  const pages = totalPages(total)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Terminal / Orders</span>
          <h2 className="text-4xl font-headline font-bold tracking-tight mt-1 text-slate-900">Quản Lý Đơn Hàng</h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-6 py-2.5 bg-surface-container-highest/50 text-on-surface font-bold rounded-xl text-sm border border-outline-variant/20 hover:bg-surface-container-highest transition-all active:scale-95">
            Xuất Báo Cáo
          </button>
          <button 
            onClick={() => navigate(ROUTES.ADMIN_PRODUCT_CREATE)}
            className="px-6 py-2.5 bg-primary-container text-on-primary-container font-bold rounded-xl text-sm shadow-[0_4px_15px_rgba(6,182,212,0.3)] hover:shadow-[0_8px_20px_rgba(6,182,212,0.4)] transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span>
            Tạo Đơn Mới
          </button>
        </div>
      </div>

      {/* KPI Cards - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] relative overflow-hidden group transition-all hover:shadow-xl hover:shadow-cyan-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60 mb-2">Tổng Đơn Hàng</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-headline font-black text-on-surface">
              {totalOrdersCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs font-bold text-primary">Tất cả trạng thái</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm font-bold">trending_up</span>
            <span className="text-[10px] text-on-surface-variant/60 uppercase font-bold tracking-wider">Hệ thống thời gian thực</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-outline-variant/5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] relative overflow-hidden group transition-all hover:shadow-xl hover:shadow-orange-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary-container/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60 mb-2">Đang Chờ Xử Lý</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-headline font-black text-tertiary">
              {pendingOrdersCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-error px-2 py-0.5 rounded-full bg-error/10">Khẩn cấp</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-sm font-bold">hourglass_empty</span>
            <span className="text-[10px] text-on-surface-variant/60 uppercase font-bold tracking-wider">Cần ưu tiên xử lý sớm</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-outline-variant/5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] relative overflow-hidden group transition-all hover:shadow-xl hover:shadow-cyan-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60 mb-2">Doanh Thu Ước Tính</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-headline font-black text-on-surface">
              {total > 0 ? `${total.toLocaleString('vi-VN')} đơn` : 'Chưa có dữ liệu'}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">Tổng</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm font-bold">payments</span>
            <span className="text-[10px] text-on-surface-variant/60 uppercase font-bold tracking-wider">Doanh thu tích lũy hệ thống</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-outline-variant/5 shadow-[0_15px_50px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Table Filters */}
        <div className="p-6 border-b border-outline-variant/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative min-w-[220px]">
              <select 
                value={status}
                onChange={(e) => { setStatus(e.target.value as OrderStatus | ''); goToPage(1) }}
                className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-4 pr-10 text-sm font-bold appearance-none focus:ring-2 focus:ring-primary-container/30 transition-all cursor-pointer"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
            <div className="relative min-w-[280px] group">
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã đơn, khách hàng..."
                className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-10 text-sm font-bold focus:ring-2 focus:ring-primary-container/30 transition-all placeholder:text-slate-400"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">search</span>
            </div>
            {/* Category Filter */}
            <div className="relative min-w-[200px]">
              <select 
                value={categoryId ?? ''}
                onChange={(e) => { setCategoryId(e.target.value ? Number(e.target.value) : undefined); goToPage(1) }}
                className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-4 pr-10 text-sm font-bold appearance-none focus:ring-2 focus:ring-primary-container/30 transition-all cursor-pointer"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">category</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
            <span>Hiển thị:</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-container text-on-primary-container font-black">10</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors">25</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors">50</button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto p-2">
          {isLoading ? (
            <div className="p-4"><TableSkeleton rows={8} cols={6} /></div>
          ) : orders.length === 0 ? (
            <div className="py-20">
              <EmptyState 
                title="Không tìm thấy đơn hàng" 
                description="Hệ thống không tìm thấy đơn hàng nào khớp với tiêu chí." 
                icon={<span className="material-symbols-outlined text-5xl text-slate-200">receipt_long</span>} 
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Mã Đơn Hàng</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Ngày Đặt</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Khách Hàng</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Sản Phẩm</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Trạng Thái</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Tổng Cộng</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {orders.map((order) => {
                  const s = STATUS_MAP[order.status] || STATUS_MAP.pending
                  const avatarColor = getAvatarColor(order.user_id)
                  const initials = getInitials(order.user_id.toString())
                  
                  return (
                    <tr 
                      key={order.id} 
                      className="hover:bg-cyan-50/30 transition-all duration-200 group border-b border-outline-variant/10"
                    >
                      <td className="px-6 py-5">
                        <span className="font-headline font-bold text-primary group-hover:text-cyan-600 transition-colors">
                          #{order.order_number}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-900">{formatDateTime(order.placed_at).split(' ')[0]}</p>
                        <p className="text-[10px] text-on-surface-variant/60 uppercase font-bold tracking-tighter">{formatDateTime(order.placed_at).split(' ')[1]}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-[10px] shadow-sm"
                            style={{ backgroundColor: avatarColor }}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{order.customer_name || `Khách hàng #${order.user_id}`}</p>
                            <p className="text-[10px] text-on-surface-variant/60 uppercase font-bold tracking-wider">{order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-900 leading-relaxed" title={order.first_item_title}>
                          {order.first_item_title || 'N/A'}
                        </p>
                        {order.item_count && order.item_count > 1 && (
                          <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-0.5">
                            + {order.item_count - 1} sản phẩm khác
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                            s.bg, s.text, `border-${s.text.replace('text-', '')}/20`
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)}></span>
                            {s.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-sm font-headline font-black text-slate-900">
                          {order.total_amount}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => navigate(ROUTES.ADMIN_ORDER_DETAIL(order.id))}
                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-primary-container/10 text-primary transition-all active:scale-90"
                            title="Xem chi tiết"
                          >
                            <span className="material-symbols-outlined text-lg font-bold">visibility</span>
                          </button>
                          <button 
                            onClick={() => navigate(ROUTES.ADMIN_ORDER_DETAIL(order.id))}
                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-highest text-on-surface-variant transition-all active:scale-90"
                            title="Thao tác"
                          >
                            <span className="material-symbols-outlined text-lg font-bold">more_vert</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Area */}
        {total > limit && (
          <div className="p-6 bg-surface-container-low/30 border-t border-outline-variant/10 flex items-center justify-between">
            <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">Đang xem {(page - 1) * limit + 1} - {Math.min(page * limit, total)} trên tổng số {total.toLocaleString('vi-VN')} đơn hàng</p>
            <div className="flex items-center gap-1">
              <Pagination page={page} totalPages={pages} onPageChange={goToPage} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Circuitry Decor */}
      <div className="flex items-center gap-4 py-4 select-none opacity-50">
        <div className="w-2 h-2 rounded-full bg-primary-container"></div>
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant/30">Kinetic Intelligence System v4.0.2</div>
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
        <div className="w-2 h-2 rounded-full bg-primary-container/40"></div>
      </div>
    </div>
  )
}
