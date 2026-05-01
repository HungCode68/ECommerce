import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { orderApi } from '@/api/order.api'
import { queryKeys } from '@/lib/queryKeys'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Pagination } from '@/components/shared/Pagination'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatVND, formatDate } from '@/utils/formatters/format'
import { ROUTES } from '@/utils/constants'
import { usePagination } from '@/hooks/usePagination'
import { ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

export function OrdersPage() {
  const { page, limit, totalPages, goToPage } = usePagination()
  const qc = useQueryClient()
  const [cancelId, setCancelId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.orders.list({ page, limit }),
    queryFn: () => orderApi.getList({ page, limit }),
  })

  const { mutate: cancelOrder, isPending: cancelling } = useMutation({
    mutationFn: (id: number) => orderApi.cancel(id, { reason: cancelReason || 'Khách hàng hủy' }),
    onSuccess: () => {
      toast.success('Đã hủy đơn hàng')
      setCancelId(null)
      setCancelReason('')
      qc.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
    onError: () => toast.error('Không thể hủy đơn hàng'),
  })

  const orders = data?.data ?? []
  const total = data?.pagination?.total ?? 0

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold text-slate-900">Đơn hàng của tôi</h1>

      {isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Chưa có đơn hàng"
          description="Bạn chưa đặt đơn hàng nào"
          icon={<ShoppingBag className="h-8 w-8" />}
          action={
            <Link to={ROUTES.PRODUCTS} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white">
              Mua sắm ngay
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    to={ROUTES.ORDER_DETAIL(order.id)}
                    className="font-mono font-semibold text-primary hover:underline"
                  >
                    #ORD-{order.id.toString().padStart(4, '0')}
                  </Link>
                  <p className="text-xs text-slate-400">{formatDate(order.created_at)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-slate-500">{order.items?.length ?? 0} sản phẩm</p>
                <p className="font-semibold text-slate-900">{formatVND(order.total_payable)}</p>
              </div>
              {order.status === 'pending' && (
                <button
                  onClick={() => setCancelId(order.id)}
                  className="mt-3 text-xs font-medium text-red-500 hover:underline"
                >
                  Hủy đơn
                </button>
              )}
            </div>
          ))}
          <div className="flex justify-center pt-2">
            <Pagination page={page} totalPages={totalPages(total)} onPageChange={goToPage} />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!cancelId}
        onOpenChange={(o) => !o && setCancelId(null)}
        title="Hủy đơn hàng"
        description="Bạn có chắc muốn hủy đơn hàng này?"
        onConfirm={() => cancelId && cancelOrder(cancelId)}
        loading={cancelling}
      />
    </div>
  )
}
