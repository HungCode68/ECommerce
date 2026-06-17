import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { ROUTES } from '@/utils/constants'
import { cn } from '@/lib/utils'
import {
    adminAPI,
} from '@/api/admin/adminStats.api'
import {
    formatCurrency,
    formatShortCurrency,
    getAvatarColor,
    getInitials,
} from '@/utils/adminDashboard'
import { generateRecentOrdersPDF } from '@/utils/pdfGenerator'
import { useAuthStore } from '@/store/authStore'
import { ExportPDFModal } from '@/features/admin/dashboard/ExportPDFModal'
import type {
    DashboardStats,
    RecentOrder,
    RevenuePoint,
    TopProduct,
} from '@/types/adminStats.types'

type Period = '1W' | '1M' | '1Y'

const PERIODS: Period[] = ['1W', '1M', '1Y']

function formatRevenueChange(value: string) {
    return value.startsWith('-') ? value : value.startsWith('+') ? value : `+${value}`
}

function mapOrderStatus(status: string): 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled' {
    switch (status) {
        case 'processing':
        case 'paid':
            return 'confirmed'
        case 'shipped':
            return 'shipping'
        case 'completed':
            return 'delivered'
        case 'cancelled':
        case 'refunded':
            return 'cancelled'
        default:
            return 'pending'
    }
}

const ORDER_STATUS_META: Record<
    'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled',
    { label: string; bg: string; text: string; dot: string }
> = {
    pending: {
        label: 'Chờ',
        bg: 'bg-cyan-100',
        text: 'text-cyan-700',
        dot: 'bg-cyan-500',
    },
    confirmed: {
        label: 'Đã xác nhận',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        dot: 'bg-blue-500',
    },
    shipping: {
        label: 'Đang giao',
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        dot: 'bg-orange-500',
    },
    delivered: {
        label: 'Đã giao',
        bg: 'bg-green-100',
        text: 'text-green-700',
        dot: 'bg-green-500',
    },
    cancelled: {
        label: 'Đã hủy',
        bg: 'bg-red-100',
        text: 'text-red-700',
        dot: 'bg-red-500',
    },
}

function StatCardSkeleton() {
    return (
        <div className="glass-panel relative overflow-hidden rounded-xl p-6 animate-pulse">
            <div className="mb-5 flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-slate-200" />
                <div className="h-6 w-16 rounded-full bg-slate-200" />
            </div>
            <div className="mb-3 h-3 w-24 rounded-full bg-slate-200" />
            <div className="mb-6 h-8 w-40 rounded-full bg-slate-200" />
            <div className="h-2 w-full rounded-full bg-slate-200">
                <div className="h-2 w-3/4 rounded-full bg-slate-300" />
            </div>
        </div>
    )
}

function MiniBars() {
    const heights = [28, 42, 34, 52, 38]
    return (
        <div className="flex h-14 items-end gap-2">
            {heights.map((height, index) => (
                <div
                    key={height}
                    className={cn(
                        'w-3 rounded-t-full',
                        index % 2 === 0 ? 'bg-cyan-500' : 'bg-cyan-200',
                    )}
                    style={{ height: `${height}%` }}
                />
            ))}
        </div>
    )
}

function AvatarStack({ count }: { count: number }) {
    const visible = Math.min(3, Math.max(count, 0))
    const extra = Math.max(count - 3, 0)

    return (
        <div className="flex items-center">
            {Array.from({ length: visible }).map((_, index) => (
                <div
                    key={index}
                    className={cn(
                        '-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold',
                        index === 0
                            ? 'bg-cyan-50 text-cyan-600'
                            : index === 1
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-orange-50 text-orange-600',
                    )}
                >
                    {String.fromCharCode(65 + index)}
                </div>
            ))}
            <div className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-cyan-500 text-[10px] font-bold text-white">
                +{extra}
            </div>
        </div>
    )
}

function RevenueTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean
    payload?: Array<{ value?: number }>
    label?: string
}) {
    if (!active || !payload?.length) {
        return null
    }

    const amount = payload[0]?.value ?? 0

    return (
        <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-lg">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="font-semibold text-slate-900">{formatCurrency(amount)}</p>
        </div>
    )
}

function RecentOrdersSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
                <div
                    key={index}
                    className="grid grid-cols-6 gap-4 rounded-xl border border-slate-100 bg-white px-4 py-4 animate-pulse"
                >
                    <div className="h-5 rounded-full bg-slate-200" />
                    <div className="h-5 rounded-full bg-slate-200" />
                    <div className="h-5 rounded-full bg-slate-200" />
                    <div className="h-5 rounded-full bg-slate-200" />
                    <div className="h-6 rounded-full bg-slate-200" />
                    <div className="h-5 rounded-full bg-slate-200" />
                </div>
            ))}
        </div>
    )
}

function InventorySkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-md bg-slate-200" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded-full bg-slate-200" />
                        <div className="h-3 w-1/2 rounded-full bg-slate-200" />
                    </div>
                    <div className="h-4 w-16 rounded-full bg-slate-200" />
                </div>
            ))}
        </div>
    )
}

function OrderStatusPill({ status }: { status: string }) {
    const mapped = ORDER_STATUS_META[mapOrderStatus(status)]
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                mapped.bg,
                mapped.text,
            )}
        >
            <span className={cn('h-1.5 w-1.5 rounded-full', mapped.dot)} />
            {mapped.label}
        </span>
    )
}

function topProductStatus(stock: number) {
    if (stock <= 5) {
        return {
            label: `Sắp hết: ${stock} sản phẩm`,
            text: 'text-error',
        }
    }
    if (stock <= 20) {
        return {
            label: `Còn ${stock} sản phẩm`,
            text: 'text-[#386570]',
        }
    }
    return {
        label: 'Còn nhiều',
        text: 'text-cyan-600',
    }
}

function DashboardStatsGrid({ stats }: { stats: DashboardStats }) {
    const customerBadge = stats.total_customers > 0 ? 'Live' : stats.customers_change
    const productBadge =
        stats.low_stock_count > 0
            ? `⚠ ${stats.low_stock_count} sắp hết`
            : 'Optimal'

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
            <div className="glass-panel group relative overflow-hidden rounded-xl p-6">
                <div className="absolute -right-4 -top-4 text-[96px] text-cyan-500/10">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        payments
                    </span>
                </div>
                <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                        <span className="material-symbols-outlined text-[22px]">payments</span>
                    </div>
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-600">
                        {formatRevenueChange(stats.revenue_change)}
                    </span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
                    Tổng doanh thu
                </p>
                <p className="mt-2 font-headline text-3xl font-bold text-slate-900">
                    {formatCurrency(stats.total_revenue)}
                </p>
                <div className="mt-5 h-2 rounded-full bg-slate-200">
                    <div className="h-full w-3/4 rounded-full bg-cyan-500" />
                </div>
            </div>

            <div className="glass-panel group relative overflow-hidden rounded-xl p-6">
                <div className="absolute -right-4 -top-4 text-[96px] text-cyan-500/10">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        shopping_bag
                    </span>
                </div>
                <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                        <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
                    </div>
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-600">
                        {stats.orders_change.startsWith('+') || stats.orders_change.startsWith('-')
                            ? stats.orders_change
                            : `+${stats.orders_change}`}
                    </span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
                    Đơn hàng hôm nay
                </p>
                <p className="mt-2 font-headline text-3xl font-bold text-slate-900">
                    {stats.total_orders.toLocaleString('vi-VN')}
                </p>
                <div className="mt-5">
                    <MiniBars />
                </div>
            </div>

            <div className="glass-panel group relative overflow-hidden rounded-xl p-6">
                <div className="absolute -right-4 -top-4 text-[96px] text-cyan-500/10">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        group
                    </span>
                </div>
                <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                        <span className="material-symbols-outlined text-[22px]">group</span>
                    </div>
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-600">
                        {customerBadge}
                    </span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
                    Khách hàng
                </p>
                <p className="mt-2 font-headline text-3xl font-bold text-slate-900">
                    {stats.total_customers.toLocaleString('vi-VN')}
                </p>
                <div className="mt-5 flex items-center justify-between">
                    <AvatarStack count={Math.max(Number(stats.total_customers), 3)} />
                </div>
            </div>

            <div className="glass-panel group relative overflow-hidden rounded-xl p-6">
                <div className="absolute -right-4 -top-4 text-[96px] text-cyan-500/10">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        inventory_2
                    </span>
                </div>
                <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                        <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                    </div>
                    <span
                        className={cn(
                            'rounded-full px-3 py-1 text-xs font-bold',
                            stats.low_stock_count > 0
                                ? 'bg-red-50 text-red-600'
                                : 'bg-cyan-50 text-cyan-600',
                        )}
                    >
                        {productBadge}
                    </span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
                    Sản phẩm
                </p>
                <p className="mt-2 font-headline text-3xl font-bold text-slate-900">
                    {stats.total_products.toLocaleString('vi-VN')}
                </p>
                <div className="circuit-line mt-5" />
            </div>
        </div>
    )
}

function StatCardsLoading() {
    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
        </div>
    )
}

function RevenueChartCard({
    period,
    setPeriod,
    data,
    isLoading,
}: {
    period: Period
    setPeriod: (period: Period) => void
    data: RevenuePoint[]
    isLoading: boolean
}) {
    return (
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="font-headline text-xl font-bold text-slate-900">
                        Doanh thu
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                        Hiệu suất theo {period === '1W' ? 'tuần' : period === '1M' ? 'tháng' : 'năm'}
                    </p>
                </div>

                <div className="flex rounded-full bg-surface-container-low p-1">
                    {PERIODS.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => setPeriod(item)}
                            className={cn(
                                'rounded-full px-4 py-1.5 text-xs font-bold transition-colors',
                                period === item
                                    ? 'bg-primary-container text-on-primary-container'
                                    : 'bg-surface-container-low text-slate-500 hover:text-slate-900',
                            )}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="min-h-[300px] animate-pulse rounded-xl bg-slate-100" />
            ) : data.length === 0 ? (
                <EmptyState
                    title="Chưa có dữ liệu doanh thu"
                    description="Không tìm thấy dữ liệu cho khoảng thời gian đã chọn."
                    icon={<span className="material-symbols-outlined text-4xl">query_stats</span>}
                />
            ) : (
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="cyanAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#94a3b8' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#94a3b8' }}
                                tickFormatter={(value: number) => formatShortCurrency(value)}
                            />
                            <Tooltip content={<RevenueTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#06b6d4"
                                strokeWidth={3}
                                fill="url(#cyanAreaGrad)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}

function InventoryPanel({
    data,
    isLoading,
}: {
    data: TopProduct[]
    isLoading: boolean
}) {
    const navigate = useNavigate()
    const lowStockProducts = data.slice(0, 3)

    return (
        <div className="rounded-xl bg-surface-container-highest/30 p-6">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h3 className="font-headline text-lg font-bold text-slate-900">
                        Cảnh báo tồn kho
                    </h3>
                    <p className="text-sm text-slate-500">Top 3 sản phẩm sắp hết hàng</p>
                </div>
                <span className="material-symbols-outlined text-slate-400">inventory</span>
            </div>

            {isLoading ? (
                <InventorySkeleton />
            ) : lowStockProducts.length === 0 ? (
                <EmptyState
                    title="Kho hàng đang ổn định"
                    description="Chưa có sản phẩm nào chạm ngưỡng cảnh báo."
                    icon={<span className="material-symbols-outlined text-4xl">inventory_2</span>}
                    action={
                        <button
                            type="button"
                            onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)}
                            className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition-colors hover:bg-cyan-100"
                        >
                            Xem tất cả kho
                        </button>
                    }
                />
            ) : (
                <div className="space-y-4">
                    {lowStockProducts.map((item) => {
                        const status = topProductStatus(item.stock_quantity)
                        const initials = getInitials(item.product_name)

                        return (
                            <div key={`${item.product_id}-${item.variant_id}`} className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-sm font-bold text-slate-600">
                                    {initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-slate-900">
                                        {item.product_name}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">
                                        {item.variant_title || 'Biến thể mặc định'}
                                        {item.sku ? ` · ${item.sku}` : ''}
                                    </p>
                                </div>
                                <p className={cn('shrink-0 text-sm font-semibold', status.text)}>
                                    {status.label}
                                </p>
                            </div>
                        )
                    })}

                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-500 transition-colors hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600"
                    >
                        Xem tất cả kho
                    </button>
                </div>
            )}
        </div>
    )
}

function SystemStatusCard() {
    return (
        <div className="relative overflow-hidden rounded-xl bg-[#00687a] p-6 text-white">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-400/20 blur-2xl" />
            <div className="relative flex items-center justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-200">
                        Cơ Sở Hạ Tầng
                    </p>
                    <h3 className="mt-2 font-headline text-xl font-bold">
                        Cloud Precision nodes
                    </h3>
                </div>
                <span className="material-symbols-outlined text-3xl text-cyan-300">
                    cloud_done
                </span>
            </div>

            <div className="relative mt-6">
                <p className="text-3xl font-black text-white">100% Up</p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-cyan-50/90">
                    Global redundancy enabled. Hệ thống sẵn sàng xử lý giao dịch và đồng bộ dữ liệu theo thời gian thực.
                </p>
            </div>
        </div>
    )
}

function RecentOrdersTable({
    data,
    isLoading,
}: {
    data: RecentOrder[]
    isLoading: boolean
}) {
    const navigate = useNavigate()
    const { user } = useAuthStore()

    return (
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-surface-container-low/50 px-8 py-6">
                <div>
                    <h2 className="font-headline text-xl font-bold text-slate-900">
                        Đơn hàng gần đây
                    </h2>
                    <p className="text-sm text-slate-500">10 đơn hàng mới nhất</p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        // Dùng setTimeout để tách event a.click() của jsPDF khỏi synchronous React event,
                        // tránh lỗi 'A component suspended while responding to synchronous input'
                        setTimeout(() => {
                            generateRecentOrdersPDF(data, user?.name)
                            toast.success('Xuất báo cáo đơn hàng thành công!')
                        }, 0)
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-cyan-200 hover:text-cyan-600"
                >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Tải báo cáo
                </button>
            </div>

            {isLoading ? (
                <div className="p-8">
                    <RecentOrdersSkeleton />
                </div>
            ) : data.length === 0 ? (
                <EmptyState
                    title="Chưa có đơn hàng nào"
                    description="Hệ thống chưa ghi nhận đơn hàng mới."
                    icon={<span className="material-symbols-outlined text-4xl">receipt_long</span>}
                    action={
                        <button
                            type="button"
                            onClick={() => navigate(ROUTES.ADMIN_ORDERS)}
                            className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition-colors hover:bg-cyan-100"
                        >
                            Xem tất cả đơn hàng
                        </button>
                    }
                />
            ) : (
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[800px] text-left">
                        <thead>
                            <tr className="bg-surface-container-low/50">
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Mã đơn
                                </th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Khách hàng
                                </th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Sản phẩm
                                </th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Tổng tiền
                                </th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Trạng thái
                                </th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.map((order) => {
                                const initials = getInitials(order.customer_name || `U${order.id}`)
                                const avatarClass = getAvatarColor(order.id)
                                const productLabel =
                                    order.first_item_title || 'Chưa có sản phẩm'
                                const otherCount =
                                    order.item_count > 1 ? ` và ${order.item_count - 1} SP khác` : ''

                                return (
                                    <tr
                                        key={order.id}
                                        className="group hover:bg-surface-bright transition-colors"
                                    >
                                        <td className="px-8 py-4 font-headline text-sm text-slate-400">
                                            #{order.order_number}
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold', avatarClass)}>
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">
                                                        {order.customer_name || 'Khách hàng'}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {order.placed_at ? new Date(order.placed_at).toLocaleDateString('vi-VN') : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-sm text-slate-600">
                                            <span className="font-medium text-slate-900">
                                                {productLabel}
                                            </span>
                                            {otherCount}
                                        </td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-900">
                                            {formatCurrency(order.total)}
                                        </td>
                                        <td className="px-8 py-4">
                                            <OrderStatusPill status={order.status} />
                                        </td>
                                        <td className="px-8 py-4">
                                            <button
                                                type="button"
                                                onClick={() => navigate(ROUTES.ADMIN_ORDER_DETAIL(order.id))}
                                                className="opacity-0 transition-opacity group-hover:opacity-100"
                                                aria-label={`Xem đơn hàng ${order.order_number}`}
                                            >
                                                <span className="material-symbols-outlined text-slate-500 transition-colors hover:text-cyan-600">
                                                    more_horiz
                                                </span>
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export function DashboardPage() {
    const [period, setPeriod] = useState<Period>('1M')
    const [isExportModalOpen, setIsExportModalOpen] = useState(false)
    const navigate = useNavigate()

    const statsQuery = useQuery({
        queryKey: ['admin', 'stats', 'dashboard'],
        queryFn: () => adminAPI.getStats(),
        refetchInterval: 30_000,
    })

    const revenueQuery = useQuery({
        queryKey: ['admin', 'stats', 'revenue', period],
        queryFn: () => adminAPI.getRevenueChart(period),
    })

    const topProductsQuery = useQuery({
        queryKey: ['admin', 'stats', 'top-products'],
        queryFn: () => adminAPI.getTopProducts(5),
    })

    const recentOrdersQuery = useQuery({
        queryKey: ['admin', 'orders', 'recent'],
        queryFn: () => adminAPI.getRecentOrders(10),
    })

    const stats = statsQuery.data
    const revenueChart = revenueQuery.data ?? []
    const topProducts = topProductsQuery.data ?? []
    const recentOrders = recentOrdersQuery.data ?? []

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-bold text-slate-900">
                        Tổng quan vận hành
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Bảng điều khiển KC29 TECH quản lý doanh thu, đơn hàng và tồn kho theo thời gian thực.
                    </p>
                </div>
                <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Xuất báo cáo PDF
                </button>
            </div>

            <ExportPDFModal 
                isOpen={isExportModalOpen} 
                onClose={() => setIsExportModalOpen(false)} 
            />

            {statsQuery.isLoading ? (
                <StatCardsLoading />
            ) : statsQuery.isError || !stats ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
                    Không thể tải dữ liệu dashboard. Vui lòng kiểm tra kết nối backend.
                </div>
            ) : (
                <DashboardStatsGrid stats={stats} />
            )}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RevenueChartCard
                        period={period}
                        setPeriod={setPeriod}
                        data={revenueChart}
                        isLoading={revenueQuery.isLoading}
                    />
                </div>

                <div className="space-y-8">
                    <InventoryPanel
                        data={topProducts}
                        isLoading={topProductsQuery.isLoading}
                    />
                    <SystemStatusCard />
                </div>
            </div>

            <RecentOrdersTable
                data={recentOrders}
                isLoading={recentOrdersQuery.isLoading}
            />

            <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_PRODUCT_CREATE)}
                className="group fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-lg shadow-cyan-500/20 transition-transform hover:scale-110 active:scale-95"
                aria-label="Thêm mới"
            >
                <span className="material-symbols-outlined text-[24px] font-bold">add</span>
                <span className="pointer-events-none absolute right-full mr-4 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    Thêm mới
                </span>
            </button>
        </div>
    )
}
