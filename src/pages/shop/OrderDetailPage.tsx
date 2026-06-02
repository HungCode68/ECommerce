import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Copy, Check, AlertCircle, QrCode, Clock, CreditCard, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { orderApi } from '@/api/order.api'
import { queryKeys } from '@/lib/queryKeys'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatVND, formatDateTime, formatProductName } from '@/utils/formatters/format'
import { ROUTES } from '@/utils/constants'

const parseVNDToNumber = (vndStr: string | number | undefined | null): number => {
  if (typeof vndStr === 'number') return vndStr
  if (!vndStr) return 0
  const cleanStr = vndStr.replace(/[^0-9-]/g, '')
  return parseInt(cleanStr, 10) || 0
}

export function OrderDetailPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const qc = useQueryClient()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const { data: order, isLoading } = useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => orderApi.getDetail(orderId),
    enabled: !!id,
  })

  const { mutate: confirmTransferred, isPending: isConfirmPending } = useMutation({
    mutationFn: () => orderApi.confirmTransferred(orderId),
    onSuccess: () => {
      toast.success('Gửi thông báo chuyển khoản thành công!')
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) })
    },
    onError: () => {
      toast.error('Gửi thông báo thất bại, vui lòng thử lại!')
    },
  })

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success(`Đã sao chép ${fieldName}!`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (isLoading) return <div className="container mx-auto px-4 py-8"><LoadingSkeleton rows={8} /></div>
  if (!order) return <div className="container mx-auto px-4 py-20 text-center text-slate-500">Không tìm thấy đơn hàng</div>

  const items = order.items ?? []
  const rawSubtotal = items.reduce((sum, item) => {
    return sum + parseVNDToNumber(item.line_subtotal ?? item.unit_price ?? item.price ?? 0)
  }, 0)
  const shippingFee = order.shipping_fee ?? 0
  const discount = order.discount ?? 0
  const rawTotalPayable = parseVNDToNumber(order.total_amount)

  // Kiểm tra xem đơn hàng đã được gửi thông báo chuyển khoản (status là processing trong payment logs) hay chưa
  const hasProcessingPayment = order.payments?.some((p) => p.status === 'processing')

  const lastFourDigits = (order.order_number || '').slice(-4)
  const transferContent = `KCTECH ${lastFourDigits}`

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link to={ROUTES.ORDERS} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold text-slate-900">
            Đơn hàng #{order.order_number}
          </h1>
          <p className="text-sm text-slate-500">{formatDateTime(order.placed_at)}</p>
        </div>
        <StatusBadge status={order.status} className="ml-auto" />
      </div>

      {/* VietQR Card for Bank Transfer */}
      {order.payment_method === 'bank_transfer' && order.status !== 'cancelled' && order.payment_status !== 'paid' && (
        <div className="mb-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
          {hasProcessingPayment ? (
            /* Banner Đang chờ đối soát */
            <div className="flex flex-col items-center justify-center p-8 text-center bg-amber-50/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 animate-pulse">
                <Clock className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-amber-900">Giao dịch đang chờ đối soát</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                Hệ thống đã nhận được thông báo chuyển khoản của bạn. Vui lòng chờ Admin kiểm tra tài khoản nhận và xác nhận duyệt đơn hàng của bạn!
              </p>
              <div className="mt-4 text-xs font-semibold text-slate-400">
                Mã đơn hàng: <span className="font-mono text-slate-600">{order.order_number}</span>
              </div>
            </div>
          ) : (
            /* Khối thông tin QR chuyển khoản */
            <div className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Thông tin chuyển khoản</h2>
                  <p className="text-xs text-slate-500">Quét mã QR bằng App ngân hàng bất kỳ để điền thông tin tự động.</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-[180px_1fr]">
                {/* QR Image */}
                <div className="flex flex-col items-center justify-center">
                  <img
                    src={`https://img.vietqr.io/image/MB-600311042005-print.png?amount=${rawTotalPayable}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent('Pham Quoc Khanh')}`}
                    alt="VietQR Chuyển khoản"
                    className="h-44 w-44 object-contain transition-transform duration-300 hover:scale-105 rounded-2xl"
                  />
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <QrCode className="h-3 w-3" />
                    VietQR Động
                  </span>
                </div>

                {/* Account details list */}
                <div className="space-y-2.5 text-sm">
                  {/* Ngân hàng */}
                  <div className="flex flex-col gap-0.5 rounded-2xl border border-slate-50 bg-slate-50/50 px-4 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ngân hàng</span>
                    <span className="font-semibold text-slate-800">MB Bank (Ngân hàng Quân Đội)</span>
                  </div>

                  {/* Số tài khoản */}
                  <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-50 bg-slate-50/50 px-4 py-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Số tài khoản</span>
                      <span className="font-mono font-bold text-slate-900 tracking-wide">600311042005</span>
                    </div>
                    <button
                      onClick={() => handleCopy('600311042005', 'Số tài khoản')}
                      type="button"
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      {copiedField === 'Số tài khoản' ? (
                        <Check className="h-4 w-4 text-green-600 animate-bounce" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Chủ tài khoản */}
                  <div className="flex flex-col gap-0.5 rounded-2xl border border-slate-50 bg-slate-50/50 px-4 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chủ tài khoản</span>
                    <span className="font-semibold text-slate-800 uppercase">Pham Quoc Khanh</span>
                  </div>

                  {/* Số tiền */}
                  <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-50 bg-slate-50/50 px-4 py-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Số tiền</span>
                      <span className="font-bold text-primary">{order.total_amount}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(rawTotalPayable.toString(), 'Số tiền')}
                      type="button"
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      {copiedField === 'Số tiền' ? (
                        <Check className="h-4 w-4 text-green-600 animate-bounce" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Nội dung */}
                  <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-50 bg-slate-50/50 px-4 py-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nội dung chuyển khoản</span>
                      <span className="font-mono font-bold text-slate-900">{transferContent}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(transferContent, 'Nội dung')}
                      type="button"
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      {copiedField === 'Nội dung' ? (
                        <Check className="h-4 w-4 text-green-600 animate-bounce" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cảnh báo */}
              <div className="mt-4 flex gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <p>
                  Vui lòng chuyển khoản đúng số tiền và nội dung ở trên. Sau khi chuyển tiền thành công, hãy bấm nút **"Tôi đã chuyển khoản"** bên dưới để hệ thống cập nhật đối soát.
                </p>
              </div>

              {/* Nút báo đã chuyển khoản */}
              <button
                onClick={() => confirmTransferred()}
                disabled={isConfirmPending}
                type="button"
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-bold text-white shadow-md shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55"
              >
                {isConfirmPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang gửi thông báo...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Tôi đã chuyển khoản
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

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
              <p className="font-mono text-sm font-semibold">{item.line_subtotal}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1.5 text-sm border-t border-slate-100 pt-4">
          <div className="flex justify-between text-slate-500"><span>Tạm tính</span><span>{formatVND(rawSubtotal)}</span></div>
          <div className="flex justify-between text-slate-500"><span>Vận chuyển</span><span>{shippingFee === 0 ? <span className="text-green-600">Miễn phí</span> : formatVND(shippingFee)}</span></div>
          {discount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{formatVND(discount)}</span></div>}
          <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100"><span>Tổng cộng</span><span className="text-primary">{order.total_amount}</span></div>
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
