import { Link } from 'react-router-dom'
import { Package2 } from 'lucide-react'
import type { Order } from '@/types/order.types'
import { cn } from '@/lib/utils'
import { formatDate, formatVND } from '@/utils/formatters/format'
import { ROUTES } from '@/utils/constants'
import { OrderStatusBadge } from './OrderStatusBadge'
import {
  getOrderItemMeta,
  getOrderItemName,
  getOrderItemPrice,
  getOrderItems,
  getOrderPlacedAt,
  getOrderStatusMeta,
  getOrderTotal,
  normalizeOrderStatus,
} from './orderHelpers'

const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000

type OrderCardProps = {
  order: Order
  onReorder: (order: Order) => void
  onViewDetail: (order: Order) => void
  onTrackOrder: (order: Order) => void
  onCancel?: (order: Order) => void
  onReview?: (order: Order) => void
  onViewOrEditReview?: (order: Order) => void
  isReviewed?: boolean
  isReordering?: boolean
  isCancelling?: boolean
}

export function OrderCard({
  order,
  onReorder,
  onViewDetail,
  onTrackOrder,
  onCancel,
  onReview,
  onViewOrEditReview,
  isReviewed,
  isReordering,
  isCancelling,
}: OrderCardProps) {
  const items = getOrderItems(order)
  const uiStatus = normalizeOrderStatus(order.status)
  const statusMeta = getOrderStatusMeta(order.status)
  const isCancelled = uiStatus === 'cancelled'

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border border-[#ccc3d8] bg-white shadow-sm transition-shadow hover:shadow-md',
        isCancelled && 'opacity-85',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e2e1] p-4">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <span className="text-base font-semibold text-[#1c1b1b]">#{order.order_number || `ORD-${order.id}`}</span>
          <span className="text-sm text-[#7b7487]">{formatDate(getOrderPlacedAt(order))}</span>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="space-y-4 p-4">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={`${order.id}-${item.product_id}-${item.variant_id}-${index}`} className="flex gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-[#ccc3d8] bg-[#f6f3f2] text-[#7c3aed]">
                <Package2 className="h-8 w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-semibold text-[#1c1b1b] md:text-base">
                  {getOrderItemName(item)}
                </h3>
                {getOrderItemMeta(item) ? (
                  <p className="mt-1 text-xs text-[#7b7487]">{getOrderItemMeta(item)}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <p className="text-[#7b7487]">Số lượng: {item.quantity}</p>
                  <p className={cn('font-semibold text-[#630ed4]', isCancelled && 'text-[#7b7487]')}>
                    {formatVND(getOrderItemPrice(item))}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-[#ccc3d8] bg-[#fcf9f8] px-4 py-5 text-sm text-[#7b7487]">
            {order.first_item_title
              ? `${order.first_item_title}${order.item_count && order.item_count > 1 ? ` và ${order.item_count - 1} sản phẩm khác` : ''}`
              : 'Đơn hàng chưa có thông tin sản phẩm để hiển thị.'}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#f6f3f2] p-4">
        <div>
          <p className="text-sm text-[#4a4455]">
            Tổng tiền:
            <span className="ml-2 text-lg font-bold text-[#630ed4]">{formatVND(getOrderTotal(order))}</span>
          </p>
          {uiStatus === 'cancelled' ? (
            <p className="mt-1 text-xs text-[#7b7487]">{order.cancel_reason || statusMeta.description}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          {(uiStatus === 'pending' || uiStatus === 'processing') && onCancel ? (
            <button
              type="button"
              onClick={() => onCancel(order)}
              disabled={isCancelling}
              className="rounded-xl border border-[#f3b6b1] px-4 py-2 text-sm font-semibold text-[#ba1a1a] transition-colors hover:bg-[#fff1f0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy đơn
            </button>
          ) : null}

          {uiStatus === 'shipping' ? (
            <button
              type="button"
              onClick={() => onTrackOrder(order)}
              className="rounded-xl border border-[#630ed4] px-4 py-2 text-sm font-semibold text-[#630ed4] transition-colors hover:bg-[#ede0ff]"
            >
              Theo dõi đơn hàng
            </button>
          ) : null}

          {(() => {
            if (order.status !== 'completed') return null

            const completedTime = order.completed_at
              ? new Date(order.completed_at).getTime()
              : new Date(order.updated_at).getTime()
            
            const isWithin15Days = Date.now() - completedTime <= FIFTEEN_DAYS_MS

            if (isReviewed && onViewOrEditReview) {
              return (
                <button
                  type="button"
                  onClick={() => onViewOrEditReview(order)}
                  className="rounded-xl border border-primary bg-primary/8 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                >
                  Đánh giá của bạn
                </button>
              )
            }

            if (!isReviewed && onReview && isWithin15Days) {
              return (
                <button
                  type="button"
                  onClick={() => onReview(order)}
                  className="rounded-xl border border-primary bg-primary/8 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                >
                  Đánh giá
                </button>
              )
            }

            return null
          })()}

          <button
            type="button"
            onClick={() => onViewDetail(order)}
            className="rounded-xl border border-[#ccc3d8] px-4 py-2 text-sm font-semibold text-[#4a4455] transition-colors hover:bg-white"
          >
            Xem chi tiết
          </button>

          {(uiStatus === 'delivered' || uiStatus === 'cancelled') && (
            <button
              type="button"
              onClick={() => onReorder(order)}
              disabled={isReordering}
              className="rounded-xl bg-[#630ed4] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Mua lại
            </button>
          )}
        </div>
      </div>

      <Link to={ROUTES.ORDER_DETAIL(order.order_number)} className="sr-only">
        Xem chi tiết đơn hàng
      </Link>
    </article>
  )
}
