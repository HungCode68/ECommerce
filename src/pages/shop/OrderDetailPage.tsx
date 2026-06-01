import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { orderApi } from '@/api/order.api'
import { queryKeys } from '@/lib/queryKeys'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatVND, formatDateTime, formatProductName } from '@/utils/formatters/format'
import { ROUTES } from '@/utils/constants'

export function OrderDetailPage() {
  const { id } = useParams()
  const orderId = Number(id)

  const { data: order, isLoading } = useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => orderApi.getDetail(orderId),
    enabled: !!id,
  })

  if (isLoading) return <div className="container mx-auto px-4 py-8"><LoadingSkeleton rows={8} /></div>
  if (!order) return <div className="container mx-auto px-4 py-20 text-center text-slate-500">Không tìm thấy đơn hàng</div>

  const items = order.items ?? []
  const subtotal = order.subtotal ?? items.reduce((sum, item) => {
    const unitPrice = item.unit_price ?? item.price ?? 0
    return sum + unitPrice * item.quantity
  }, 0)
  const shippingFee = order.shipping_fee ?? 0
  const discount = order.discount ?? 0
  const totalPayable = order.total_payable ?? Number(order.total_amount ?? 0)

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link to={ROUTES.ORDERS} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold text-slate-900">
            Đơn hàng #ORD-{order.id.toString().padStart(4, '0')}
          </h1>
          <p className="text-sm text-slate-500">{formatDateTime(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} className="ml-auto" />
      </div>

      {/* Items */}
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm mb-4">
        <h2 className="mb-4 font-semibold text-slate-800">Sản phẩm</h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">{formatProductName(item.product_name ?? item.title ?? `Sản phẩm #${item.product_id}`)}</p>
                <p className="text-xs text-slate-400">x{item.quantity}</p>
              </div>
              <p className="font-mono text-sm font-semibold">{formatVND((item.unit_price ?? item.price ?? 0) * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1.5 text-sm border-t border-slate-100 pt-4">
          <div className="flex justify-between text-slate-500"><span>Tạm tính</span><span>{formatVND(subtotal)}</span></div>
          <div className="flex justify-between text-slate-500"><span>Vận chuyển</span><span>{shippingFee === 0 ? <span className="text-green-600">Miễn phí</span> : formatVND(shippingFee)}</span></div>
          {discount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{formatVND(discount)}</span></div>}
          <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100"><span>Tổng cộng</span><span className="text-primary">{formatVND(totalPayable)}</span></div>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm text-sm space-y-2">
        <h2 className="font-semibold text-slate-800 mb-3">Thông tin</h2>
        <div className="flex justify-between"><span className="text-slate-500">Thanh toán</span><span className="text-slate-800">{order.payment_method === 'cod' ? 'Tiền mặt (COD)' : 'Chuyển khoản'}</span></div>
        {order.note && <div className="flex justify-between"><span className="text-slate-500">Ghi chú</span><span className="text-slate-800">{order.note}</span></div>}
        {order.cancel_reason && <div className="flex justify-between"><span className="text-slate-500">Lý do hủy</span><span className="text-red-500">{order.cancel_reason}</span></div>}
      </div>
    </div>
  )
}
