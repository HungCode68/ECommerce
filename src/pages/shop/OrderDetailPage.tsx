import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Copy, Check, AlertCircle, QrCode, Clock, CreditCard, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { orderApi } from '@/api/order.api'
import { reviewApi } from '@/api/review.api'

import { OrderStatusBadge } from '@/features/shop/orders/OrderStatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CancelOrderModal } from '@/features/shop/orders/CancelOrderModal'
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
  const qc = useQueryClient()
  const isNumericId = id ? !isNaN(Number(id)) && !id.startsWith('#') : false
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const { mutate: cancelOrder, isPending: cancelling } = useMutation({
    mutationFn: (reason: string) => orderApi.cancel(order?.id ?? 0, { reason }),
    onSuccess: () => {
      toast.success('Đã hủy đơn hàng')
      setCancelModalOpen(false)
      setCancelReason('')
      qc.invalidateQueries({ queryKey: ['orderDetail', id] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: () => toast.error('Không thể hủy đơn hàng'),
  })

  const { data: order, isLoading } = useQuery({
    queryKey: ['orderDetail', id],
    queryFn: () => {
      if (isNumericId) {
        return orderApi.getDetail(Number(id))
      }
      return orderApi.getDetailByCode(id as string)
    },
    enabled: !!id,
  })

  const { mutate: confirmTransferred, isPending: isConfirmPending } = useMutation({
    mutationFn: () => orderApi.confirmTransferred(order?.id ?? 0),
    onSuccess: () => {
      toast.success('Gửi thông báo chuyển khoản thành công!')
      qc.invalidateQueries({ queryKey: ['orderDetail', id] })
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

  const [activeReviewProduct, setActiveReviewProduct] = useState<{ id: number; name: string } | null>(null)
  const [rating, setRating] = useState(5)
  const [reviewBody, setReviewBody] = useState('')
  const [reviewImages, setReviewImages] = useState<string[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const { mutate: submitReview, isPending: isSubmittingReview } = useMutation({
    mutationFn: (payload: { productId: number; rating: number; body: string; image_urls?: string[] }) =>
      reviewApi.create(payload.productId, {
        order_id: order!.id,
        rating: payload.rating,
        body: payload.body,
        performance_rating: payload.rating,
        battery_rating: payload.rating,
        camera_rating: payload.rating,
        image_urls: payload.image_urls,
      }),
    onSuccess: () => {
      toast.success('Đánh giá sản phẩm thành công! Cảm ơn bạn.')
      setActiveReviewProduct(null)
      setRating(5)
      setReviewBody('')
      setReviewImages([])
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || 'Gửi đánh giá thất bại, vui lòng thử lại!'
      toast.error(errMsg)
    },
  })

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setIsUploadingImage(true)
    try {
      const url = await reviewApi.uploadImage(files[0])
      setReviewImages((prev) => [...prev, url])
      toast.success('Tải ảnh lên thành công!')
    } catch {
      toast.error('Tải ảnh lên thất bại!')
    } finally {
      setIsUploadingImage(false)
    }
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
        <OrderStatusBadge status={order.status} className="ml-auto" />
      </div>

      {/* Hành động chính cho đơn hàng */}
      {(() => {
        const uiStatus = order.status === 'processing' || order.status === 'confirmed' ? 'processing' : order.status === 'pending' ? 'pending' : '';
        if (uiStatus === 'pending' || uiStatus === 'processing') {
          return (
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => setCancelModalOpen(true)}
                className="rounded-xl border border-[#f3b6b1] px-4 py-2 text-sm font-semibold text-[#ba1a1a] transition-colors hover:bg-[#fff1f0]"
              >
                Hủy đơn hàng
              </button>
            </div>
          )
        }
        return null
      })()}

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

      {/* Cancellation Details */}
      {order.status === 'cancelled' && (
        <div className="mt-6 mb-4 rounded-xl border border-red-100 bg-red-50 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-bold text-red-800 text-lg">Chi tiết thông tin hủy đơn</h3>
          </div>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Thời gian hủy:</span>
              <span className="font-semibold text-slate-800">{order.cancelled_at ? formatDateTime(order.cancelled_at) : 'Không xác định'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Yêu cầu bởi:</span>
              <span className="font-semibold text-slate-800">
                {order.cancel_reason?.startsWith('Khách hủy:') ? 'Người mua (Bạn)' : 'Hệ thống / Quản trị viên'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Lý do hủy:</span>
              <span className="font-semibold text-slate-800 text-right max-w-[60%]">
                {order.cancel_reason?.replace('Khách hủy: ', '') || 'Không có lý do'}
              </span>
            </div>

            {order.payment_method === 'bank_transfer' && (
              <>
                <div className="h-px bg-red-200 my-2" />
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Trạng thái hoàn tiền:</span>
                  <span className="font-semibold text-orange-600">
                    {order.payment_status === 'refunded' ? 'Đã hoàn tiền' : 'Chờ hoàn tiền (nếu bạn đã chuyển khoản)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Số tiền hoàn lại:</span>
                  <span className="font-bold text-red-600 text-lg">{formatVND(parseVNDToNumber(order.total_amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Hoàn vào tài khoản:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[60%]">
                    Tài khoản ngân hàng gốc (Vui lòng liên hệ CSKH nếu cần hỗ trợ)
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm mb-4">
        <h2 className="mb-4 font-semibold text-slate-800">Sản phẩm</h2>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex items-start justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium text-slate-800">
                  {formatProductName(item.product_name ?? item.title ?? `Sản phẩm #${item.product_id}`)}
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-xs text-slate-400">x{item.quantity}</span>
                  {order.status === 'completed' && (
                    <button
                      onClick={() => setActiveReviewProduct({
                        id: item.product_id,
                        name: item.product_name ?? item.title ?? `Sản phẩm #${item.product_id}`
                      })}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">star</span>
                      Đánh giá sản phẩm
                    </button>
                  )}
                </div>
              </div>
              <p className="font-mono text-sm font-semibold text-slate-800">{item.line_subtotal}</p>
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

      {/* Confirm Cancel Dialog */}
      <CancelOrderModal
        open={cancelModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCancelModalOpen(false)
          }
        }}
        onConfirm={(reason) => cancelOrder(reason)}
        loading={cancelling}
      />

      {/* Review Modal */}
      {activeReviewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl transition-all duration-300">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Đánh giá sản phẩm</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-1">{activeReviewProduct.name}</p>

            {/* Stars selection */}
            <div className="mb-4 flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mức độ hài lòng</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-amber-400 transition hover:scale-110"
                  >
                    <span className="material-symbols-outlined text-[32px] fill-current" style={{ fontVariationSettings: `"${rating >= star ? 'FILL' : 'GRAD'}" 1` }}>
                      {rating >= star ? 'star' : 'star'}
                    </span>
                  </button>
                ))}
              </div>
              <span className="text-sm font-bold text-amber-500">
                {rating === 5 ? 'Cực kỳ hài lòng' : rating === 4 ? 'Hài lòng' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Không hài lòng' : 'Rất tệ'}
              </span>
            </div>

            {/* Text review */}
            <div className="mb-4">
              <textarea
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                placeholder="Hãy chia sẻ nhận xét của bạn về sản phẩm này nhé (hiệu năng, thiết kế, chất lượng...)"
                rows={4}
                className="w-full rounded-2xl border border-slate-200 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="mt-1 flex justify-between text-xs">
                <span className={reviewBody.length < 15 ? 'text-red-500 font-medium animate-pulse' : 'text-green-600 font-medium'}>
                  {reviewBody.length < 15 ? `Cần nhập thêm ít nhất ${15 - reviewBody.length} ký tự` : 'Độ dài hợp lệ'}
                </span>
                <span className="text-slate-400">{reviewBody.length}/1000</span>
              </div>
            </div>

            {/* Review images upload */}
            <div className="mb-6">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Thêm hình ảnh thực tế</span>
              <div className="flex flex-wrap gap-2">
                {reviewImages.map((url, idx) => (
                  <div key={idx} className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-100">
                    <img src={url} alt="Review" className="h-full w-full object-cover" />
                    <button
                      onClick={() => setReviewImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black"
                    >
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  </div>
                ))}
                
                {reviewImages.length < 3 && (
                  <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/40 hover:bg-slate-50 transition-colors">
                    {isUploadingImage ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="material-symbols-outlined text-slate-400 text-[20px]">add_a_photo</span>
                        <span className="text-[10px] text-slate-400 font-medium">Tải ảnh</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadImage}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Actions buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActiveReviewProduct(null)
                  setRating(5)
                  setReviewBody('')
                  setReviewImages([])
                }}
                disabled={isSubmittingReview}
                className="flex-1 rounded-2xl border border-slate-200 py-3 font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => submitReview({
                  productId: activeReviewProduct.id,
                  rating,
                  body: reviewBody,
                  image_urls: reviewImages,
                })}
                disabled={reviewBody.length < 15 || reviewBody.length > 1000 || isSubmittingReview || isUploadingImage}
                className="flex-1 rounded-2xl bg-primary py-3 font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
