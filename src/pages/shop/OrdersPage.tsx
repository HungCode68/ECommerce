import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cartApi } from '@/api/cart.api'
import { orderApi } from '@/api/order.api'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { queryKeys } from '@/lib/queryKeys'
import { Pagination } from '@/components/shared/Pagination'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { ROUTES } from '@/utils/constants'
import { usePagination } from '@/hooks/usePagination'
import type { Order } from '@/types/order.types'
import { EmptyOrders } from '@/features/shop/orders/EmptyOrders'
import { OrderCard } from '@/features/shop/orders/OrderCard'
import { OrderTabs } from '@/features/shop/orders/OrderTabs'
import {
  type OrderFilterTab,
  normalizeOrderStatus,
} from '@/features/shop/orders/orderHelpers'

export function OrdersPage() {
  const navigate = useNavigate()
  const { page, limit, totalPages, goToPage } = usePagination()
  const qc = useQueryClient()
  const [tab, setTab] = useState<OrderFilterTab>('all')
  const [cancelId, setCancelId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const statusParam =
    tab === 'all' ? undefined : tab === 'delivered' ? ('delivered' as const) : tab

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.orders.list({ page, limit, status: statusParam }),
    queryFn: () => orderApi.getList({ page, limit, status: statusParam }),
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

  const { mutate: reorderOrder, isPending: reordering } = useMutation({
    mutationFn: async (order: Order) => {
      const items = order.items?.filter((item) => item.product_id && item.variant_id && item.quantity > 0) ?? []
      if (items.length === 0) {
        const fallbackProductId = order.items?.[0]?.product_id
        if (fallbackProductId) {
          return { mode: 'navigate' as const, productId: fallbackProductId }
        }
        throw new Error('Đơn hàng không có sản phẩm để mua lại')
      }

      for (const item of items) {
        await cartApi.addItem({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        })
      }

      return { mode: 'cart' as const }
    },
    onSuccess: (result) => {
      if (result?.mode === 'navigate') {
        navigate(ROUTES.PRODUCT_DETAIL(result.productId))
        return
      }

      qc.invalidateQueries({ queryKey: queryKeys.cart })
      toast.success('Đã thêm lại sản phẩm vào giỏ hàng')
      navigate(ROUTES.CART)
    },
    onError: () => {
      toast.error('Không thể mua lại đơn hàng này')
    },
  })

  const orders: Order[] = Array.isArray(data?.data)
    ? data.data
    : ((data?.data as { orders?: Order[] } | undefined)?.orders ?? [])

  const filteredOrders =
    tab === 'all' ? orders : orders.filter((order) => normalizeOrderStatus(order.status) === tab)

  const total =
    data?.pagination?.total ??
    ((data?.data as { total?: number } | undefined)?.total ?? filteredOrders.length)

  const handleTabChange = (nextTab: OrderFilterTab) => {
    setTab(nextTab)
    goToPage(1)
  }

  const handleViewDetail = (order: Order) => navigate(ROUTES.ORDER_DETAIL(order.id))
  const handleTrackOrder = (order: Order) => navigate(ROUTES.ORDER_DETAIL(order.id))

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6">
      <section>
        <h1 className="mb-6 text-[24px] font-bold leading-[1.3] text-[#1c1b1b]">Đơn hàng của tôi</h1>

        <OrderTabs value={tab} onChange={handleTabChange} />

        {isLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : filteredOrders.length === 0 ? (
          <EmptyOrders
            title={tab === 'all' ? 'Bạn chưa có đơn hàng nào' : 'Không có đơn hàng ở trạng thái này'}
            description={
              tab === 'all'
                ? 'Hãy khám phá các sản phẩm công nghệ nổi bật và bắt đầu đơn hàng đầu tiên của bạn.'
                : 'Hãy thử chuyển sang tab khác hoặc tiếp tục mua sắm để tạo đơn hàng mới.'
            }
          />
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewDetail={handleViewDetail}
                onTrackOrder={handleTrackOrder}
                onReorder={(nextOrder) => reorderOrder(nextOrder)}
                onCancel={(nextOrder) => setCancelId(nextOrder.id)}
                isReordering={reordering}
                isCancelling={cancelling && cancelId === order.id}
              />
            ))}

            <div className="flex justify-center pt-2">
              <Pagination page={page} totalPages={totalPages(total)} onPageChange={goToPage} />
            </div>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!cancelId}
        onOpenChange={(open) => {
          if (!open) {
            setCancelId(null)
            setCancelReason('')
          }
        }}
        title="Hủy đơn hàng"
        description="Bạn có chắc muốn hủy đơn hàng này?"
        onConfirm={() => cancelId && cancelOrder(cancelId)}
        loading={cancelling}
      />
    </div>
  )
}
