import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminOrderApi } from '@/api/admin/adminOrder.api'
import { queryKeys } from '@/lib/queryKeys'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Pagination } from '@/components/shared/Pagination'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatVND, formatDate } from '@/utils/formatters/format'
import { ROUTES } from '@/utils/constants'
import { usePagination } from '@/hooks/usePagination'
import type { OrderStatus } from '@/types/order.types'
import { ShoppingBag } from 'lucide-react'

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ xác nhận', value: 'pending' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Đang giao', value: 'shipping' },
  { label: 'Đã giao', value: 'delivered' },
  { label: 'Đã hủy', value: 'cancelled' },
]

export function OrdersPage() {
  const navigate = useNavigate()
  const { page, limit, totalPages, goToPage } = usePagination()
  const [status, setStatus] = useState<OrderStatus | ''>('')

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.orders.list({ page, limit, status }),
    queryFn: () => adminOrderApi.getList({ page, limit, status: status as OrderStatus || undefined }),
  })

  const orders = data?.data ?? []
  const total = data?.pagination?.total ?? 0
  const pages = totalPages(total)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Quản lý đơn hàng</h1>
        <p className="text-sm text-slate-500">{total} đơn hàng</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setStatus(opt.value as OrderStatus | ''); goToPage(1) }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              status === opt.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : orders.length === 0 ? (
        <EmptyState title="Không có đơn hàng" description="Chưa có đơn hàng nào trong trạng thái này" icon={<ShoppingBag className="h-8 w-8" />} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Mã đơn</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Ngày đặt</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Thanh toán</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Tổng tiền</th>
                <th className="px-4 py-3 text-center font-medium text-slate-600">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => navigate(ROUTES.ADMIN_ORDER_DETAIL(order.id))}
                  className="border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-medium text-blue-600">
                    #ORD-{order.id.toString().padStart(4, '0')}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3 text-slate-500">{order.payment_method === 'cod' ? 'COD' : 'Chuyển khoản'}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{formatVND(order.total_payable)}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-4 py-3 flex justify-end">
            <Pagination page={page} totalPages={pages} onPageChange={goToPage} />
          </div>
        </div>
      )}
    </div>
  )
}
