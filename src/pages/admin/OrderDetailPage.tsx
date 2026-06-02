import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { adminOrderApi } from '@/api/admin/adminOrder.api'
import { queryKeys } from '@/lib/queryKeys'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatVND, formatDateTime } from '@/utils/formatters/format'
import { ORDER_STATUS_LABEL, ROUTES } from '@/utils/constants'
import type { OrderStatus } from '@/types/order.types'

const parseVNDToNumber = (vndStr: string | number | undefined | null): number => {
  if (typeof vndStr === 'number') return vndStr
  if (!vndStr) return 0
  const cleanStr = vndStr.replace(/[^0-9-]/g, '')
  return parseInt(cleanStr, 10) || 0
}

const NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['delivered', 'cancelled'],
}

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('')
  const [note, setNote] = useState('')

  const { data: order, isLoading } = useQuery({
    queryKey: queryKeys.admin.orders.detail(Number(id)),
    queryFn: () => adminOrderApi.getDetail(Number(id)),
    enabled: !!id,
  })

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: () =>
      adminOrderApi.updateStatus(Number(id), {
        status: selectedStatus as OrderStatus,
        note: note || undefined,
      }),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công!')
      qc.invalidateQueries({ queryKey: queryKeys.admin.orders.detail(Number(id)) })
      setSelectedStatus('')
      setNote('')
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  })

  if (isLoading || !order) {
    return <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
  }

  const nextStatuses = NEXT_STATUSES[order.status] ?? []
  const items = order.items ?? []
  const rawSubtotal = items.reduce((sum, item) => {
    return sum + parseVNDToNumber(item.line_subtotal ?? item.unit_price ?? item.price ?? 0)
  }, 0)
  const shippingFee = order.shipping_fee ?? 0
  const discount = order.discount ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.ADMIN_ORDERS)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">
              Đơn hàng #{order.order_number}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-slate-500">{formatDateTime(order.placed_at)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-800">Sản phẩm</h3>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.product_name ?? item.title ?? `SP #${item.product_id}`}</p>
                    <p className="text-xs text-slate-400">x{item.quantity}</p>
                  </div>
                  <p className="font-mono text-sm font-semibold">{item.line_subtotal}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 text-sm">
              <Row label="Tạm tính" value={formatVND(rawSubtotal)} />
              <Row label="Phí vận chuyển" value={shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)} />
              {discount > 0 && (
                <Row label="Giảm giá" value={`-${formatVND(discount)}`} valueClass="text-green-600" />
              )}
              <div className="border-t border-slate-100 pt-2">
                <Row label="Tổng thanh toán" value={String(order.total_amount)} valueClass="text-lg font-bold text-slate-900" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Update status */}
          {nextStatuses.length > 0 && (
            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 font-semibold text-slate-800">Cập nhật trạng thái</h3>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">-- Chọn trạng thái --</option>
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                ))}
              </select>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú (tùy chọn)"
                rows={2}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                onClick={() => updateStatus()}
                disabled={!selectedStatus || isPending}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Xác nhận
              </button>
            </div>
          )}

          {/* Order info */}
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-2 text-sm">
            <h3 className="font-semibold text-slate-800 mb-3">Thông tin đơn hàng</h3>
            <Row label="Thanh toán" value={order.payment_method === 'cod' ? 'COD' : 'Chuyển khoản'} />
            {order.note && <Row label="Ghi chú" value={order.note} />}
            {order.cancel_reason && <Row label="Lý do hủy" value={order.cancel_reason} valueClass="text-red-500" />}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={valueClass ?? 'font-medium text-slate-800'}>{value}</span>
    </div>
  )
}
