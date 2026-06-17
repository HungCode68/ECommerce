import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { cartApi } from '@/api/cart.api'
import { orderApi } from '@/api/order.api'
import { reviewApi } from '@/api/review.api'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { queryKeys } from '@/lib/queryKeys'
import { Pagination } from '@/components/shared/Pagination'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { ROUTES } from '@/utils/constants'
import { usePagination } from '@/hooks/usePagination'
import type { Order, OrderStatus } from '@/types/order.types'
import { EmptyOrders } from '@/features/shop/orders/EmptyOrders'
import { OrderCard } from '@/features/shop/orders/OrderCard'
import { CancelOrderModal } from '@/features/shop/orders/CancelOrderModal'
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

  // Review modal state
  const [reviewedOrders, setReviewedOrders] = useState<Record<number, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('reviewedOrders') || '{}')
    } catch {
      return {}
    }
  })
  const [activeReviewProduct, setActiveReviewProduct] = useState<{ orderId: number; id: number; name: string, existingReview?: any } | null>(null)
  const [rating, setRating] = useState(5)
  const [reviewBody, setReviewBody] = useState('')
  const [reviewImages, setReviewImages] = useState<string[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const statusParam =
    tab === 'all'
      ? undefined
      : tab === 'delivered'
      ? ('completed' as OrderStatus)
      : tab === 'shipping'
      ? ('shipped' as OrderStatus)
      : (tab as OrderStatus)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.orders.list({ page, limit, status: statusParam }),
    queryFn: () => orderApi.getList({ page, limit, status: statusParam }),
  })

  const { mutate: cancelOrder, isPending: cancelling } = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => orderApi.cancel(id, { reason }),
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
      let detailedOrder = order
      if (!order.items || order.items.length === 0) {
        detailedOrder = await orderApi.getDetailByCode(order.order_number)
      }

      const items = detailedOrder.items?.filter((item) => item.product_id && item.variant_id != null && item.quantity > 0) ?? []
      if (items.length === 0) {
        const fallbackProductId = detailedOrder.items?.[0]?.product_id
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

  const { mutate: submitReview, isPending: isSubmittingReview } = useMutation({
    mutationFn: (payload: { orderId: number; productId: number; rating: number; body?: string; image_urls?: string[]; isEdit?: boolean; reviewId?: number }) => {
      const data = {
        rating: payload.rating,
        body: payload.body,
        performance_rating: payload.rating,
        battery_rating: payload.rating,
        camera_rating: payload.rating,
        image_urls: payload.image_urls,
      }
      if (payload.isEdit && payload.reviewId) {
        return reviewApi.update(payload.productId, payload.reviewId, data)
      }
      return reviewApi.create(payload.productId, { ...data, order_id: payload.orderId })
    },
    onSuccess: (_, variables) => {
      toast.success(variables.isEdit ? 'Cập nhật đánh giá thành công!' : 'Đánh giá sản phẩm thành công! Cảm ơn bạn.')
      if (activeReviewProduct) {
        const newReviewed = { ...reviewedOrders, [activeReviewProduct.orderId]: activeReviewProduct.id }
        setReviewedOrders(newReviewed)
        localStorage.setItem('reviewedOrders', JSON.stringify(newReviewed))
      }
      resetReviewModal()
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || 'Gửi đánh giá thất bại, vui lòng thử lại!'
      toast.error(errMsg)
    },
  })

  const { mutate: deleteReview, isPending: isDeletingReview } = useMutation({
    mutationFn: (payload: { productId: number; reviewId: number; orderId: number }) =>
      reviewApi.delete(payload.productId, payload.reviewId),
    onSuccess: (_, variables) => {
      toast.success('Xóa đánh giá thành công!')
      const newReviewed = { ...reviewedOrders }
      delete newReviewed[variables.orderId]
      setReviewedOrders(newReviewed)
      localStorage.setItem('reviewedOrders', JSON.stringify(newReviewed))
      resetReviewModal()
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || 'Xóa đánh giá thất bại!'
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

  const resetReviewModal = () => {
    setActiveReviewProduct(null)
    setRating(5)
    setReviewBody('')
    setReviewImages([])
  }

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

  const handleViewDetail = (order: Order) => navigate(ROUTES.ORDER_DETAIL(order.order_number))
  const handleTrackOrder = (order: Order) => navigate(ROUTES.ORDER_DETAIL(order.order_number))

  const handleReview = async (order: Order) => {
    try {
      const detail = await orderApi.getDetailByCode(order.order_number)
      const items = detail?.items ?? []
      if (items.length === 0) {
        toast.error('Đơn hàng không có sản phẩm để đánh giá')
        return
      }
      const firstItem = items[0]
      setActiveReviewProduct({
        orderId: order.id,
        id: firstItem.product_id,
        name: firstItem.product_name ?? firstItem.title ?? `Sản phẩm #${firstItem.product_id}`,
      })
    } catch {
      toast.error('Không thể tải thông tin đơn hàng')
    }
  }

  const handleViewOrEditReview = async (order: Order) => {
    try {
      const productId = reviewedOrders[order.id]
      if (!productId) return

      const review = await reviewApi.getByOrder(productId, order.id)
      const detail = await orderApi.getDetailByCode(order.order_number)
      const item = detail?.items?.find((i) => i.product_id === productId)
      
      setActiveReviewProduct({
        orderId: order.id,
        id: productId,
        name: item?.product_name ?? item?.title ?? `Sản phẩm #${productId}`,
        existingReview: review,
      })
      setRating(review.rating)
      setReviewBody(review.body || '')
      setReviewImages(review.image_urls || [])
    } catch {
      toast.error('Không thể tải đánh giá')
    }
  }

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
                onReview={handleReview}
                onViewOrEditReview={handleViewOrEditReview}
                isReviewed={!!reviewedOrders[order.id]}
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

      <CancelOrderModal
        open={!!cancelId}
        onOpenChange={(open) => {
          if (!open) {
            setCancelId(null)
          }
        }}
        onConfirm={(reason) => {
          if (cancelId) {
            cancelOrder({ id: cancelId, reason })
          }
        }}
        loading={cancelling}
      />

      {/* Review Modal */}
      {activeReviewProduct && (() => {
        const review = activeReviewProduct.existingReview
        const createdAt = review?.created_at ? new Date(review.created_at).getTime() : 0
        const isWithin48h = review ? (Date.now() - createdAt <= 48 * 60 * 60 * 1000) : true
        const canEdit = !review || (!review.is_edited && isWithin48h)
        const isReadonly = review && !canEdit

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl transition-all duration-300 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {review ? (canEdit ? 'Sửa đánh giá' : 'Đánh giá của bạn') : 'Đánh giá sản phẩm'}
              </h3>
              {isReadonly && <p className="text-xs text-amber-600 font-semibold mb-2 bg-amber-50 p-2 rounded-lg border border-amber-200">Đánh giá này không thể chỉnh sửa nữa (chỉ được sửa 1 lần trong 48h).</p>}
              <p className="text-sm text-slate-500 mb-4 line-clamp-1">{activeReviewProduct.name}</p>

            {/* Stars selection */}
            <div className="mb-4 flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mức độ hài lòng</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => canEdit && setRating(star)}
                    disabled={!canEdit}
                    className={`text-amber-400 transition ${canEdit ? 'hover:scale-110' : 'cursor-default opacity-80'}`}
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
                disabled={!canEdit}
                placeholder="Hãy chia sẻ nhận xét của bạn về sản phẩm này nhé (không bắt buộc)"
                rows={4}
                className={`w-full rounded-2xl border border-slate-200 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 ${!canEdit ? 'bg-slate-50' : ''}`}
              />
              <div className="mt-1 flex justify-between text-xs">
                <span className={reviewBody.length > 0 && reviewBody.length < 15 ? 'text-red-500 font-medium animate-pulse' : 'text-slate-400 font-medium'}>
                  {reviewBody.length > 0 && reviewBody.length < 15 ? `Cần nhập thêm ít nhất ${15 - reviewBody.length} ký tự` : (reviewBody.length === 0 ? 'Tùy chọn' : 'Độ dài hợp lệ')}
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
                    {canEdit && (
                      <button
                        onClick={() => setReviewImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black"
                      >
                        <span className="material-symbols-outlined text-[12px]">close</span>
                      </button>
                    )}
                  </div>
                ))}

                {canEdit && reviewImages.length < 3 && (
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
                onClick={resetReviewModal}
                disabled={isSubmittingReview || isDeletingReview}
                className="flex-1 rounded-2xl border border-slate-200 py-3 font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                {isReadonly ? 'Đóng' : 'Hủy bỏ'}
              </button>

              {review && isWithin48h && (
                <button
                  onClick={() => deleteReview({ productId: activeReviewProduct.id, reviewId: review.id, orderId: activeReviewProduct.orderId })}
                  disabled={isDeletingReview || isSubmittingReview}
                  className="flex-1 rounded-2xl border border-red-200 bg-red-50 text-red-600 py-3 font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {isDeletingReview ? 'Đang xóa...' : 'Xóa'}
                </button>
              )}

              {canEdit && (
                <button
                  onClick={() => submitReview({
                    orderId: activeReviewProduct.orderId,
                    productId: activeReviewProduct.id,
                    rating,
                    body: reviewBody.trim() === '' ? undefined : reviewBody,
                    image_urls: reviewImages,
                    isEdit: !!review,
                    reviewId: review?.id
                  })}
                  disabled={(reviewBody.length > 0 && reviewBody.length < 15) || reviewBody.length > 1000 || isSubmittingReview || isUploadingImage}
                  className="flex-1 rounded-2xl bg-primary py-3 font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Đang lưu...' : (review ? 'Cập nhật' : 'Gửi đánh giá')}
                </button>
              )}
            </div>
            
            {review?.seller_reply && (
              <div className="mt-6 border-t border-slate-100 pt-4">
                <div className="rounded-xl bg-slate-50 p-4 relative">
                  <div className="absolute -top-3 left-4 bg-slate-50 px-2 text-xs font-bold text-slate-700">
                    Phản hồi từ người bán
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{review.seller_reply}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        )
      })()}
    </div>
  )
}
