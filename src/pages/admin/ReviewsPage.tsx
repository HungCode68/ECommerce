import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { reviewApi } from '@/api/review.api'
import { Pagination } from '@/components/shared/Pagination'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { usePagination } from '@/hooks/usePagination'
import { formatDate } from '@/utils/formatters/format'
import type { Review } from '@/types/product.types'

export function ReviewsPage() {
  const { page, limit, totalPages, goToPage } = usePagination()
  const qc = useQueryClient()
  const [activeReview, setActiveReview] = useState<Review | null>(null)
  const [replyBody, setReplyBody] = useState('')

  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null)
  const [deleteReason, setDeleteReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', { page, limit }],
    queryFn: () => reviewApi.adminGetAll({ page, limit }),
  })

  const { mutate: submitReply, isPending: isSubmitting } = useMutation({
    mutationFn: (payload: { reviewId: number; reply: string }) => reviewApi.adminReply(payload.reviewId, payload.reply),
    onSuccess: () => {
      toast.success('Phản hồi đánh giá thành công!')
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      setActiveReview(null)
      setReplyBody('')
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || 'Phản hồi thất bại!'
      toast.error(errMsg)
    },
  })

  const { mutate: submitDelete, isPending: isDeleting } = useMutation({
    mutationFn: (payload: { reviewId: number; reason: string }) => reviewApi.adminDelete(payload.reviewId, payload.reason),
    onSuccess: () => {
      toast.success('Đã xóa đánh giá thành công!')
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      setReviewToDelete(null)
      setDeleteReason('')
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || 'Xóa đánh giá thất bại!'
      toast.error(errMsg)
    },
  })

  const reviews: Review[] = data?.data || []
  const total = data?.pagination?.total || 0

  const handleOpenReply = (review: Review) => {
    setActiveReview(review)
    setReplyBody(review.seller_reply || '')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Đánh giá sản phẩm</h1>
          <p className="text-sm text-slate-500">Quản lý và phản hồi đánh giá của khách hàng</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Đánh giá</th>
                <th className="px-6 py-4 w-1/3">Nội dung</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-6">
                    <TableSkeleton rows={5} cols={5} />
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Chưa có đánh giá nào.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => {
                  const createdAt = new Date(review.created_at).getTime()
                  const isWithin48h = Date.now() - createdAt <= 48 * 60 * 60 * 1000
                  const isDeleted = !!review.deleted_at
                  return (
                    <tr key={review.id} className={`transition-colors hover:bg-slate-50/50 ${isDeleted ? 'opacity-60 bg-slate-50' : ''}`}>
                      <td className="px-6 py-4 align-top">
                        <div className="font-medium text-slate-900">{review.user_name || 'Khách hàng'}</div>
                        {isDeleted && <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">ĐÃ XÓA</span>}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-1 mb-2">
                          <span className="font-bold text-slate-900 text-base">{review.rating}</span>
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        </div>
                        <div className="flex flex-col gap-1 text-[11px] text-slate-500 min-w-[100px]">
                          <div className="flex items-center justify-between">
                            <span>Hiệu năng:</span>
                            <span className="font-semibold text-slate-700">{review.performance_rating}/5</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Pin:</span>
                            <span className="font-semibold text-slate-700">{review.battery_rating}/5</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Camera:</span>
                            <span className="font-semibold text-slate-700">{review.camera_rating}/5</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <p className="line-clamp-3 text-slate-600 mb-2">
                          {review.body || <span className="text-slate-400 italic">Không có bình luận</span>}
                        </p>
                        
                        {review.image_urls && review.image_urls.length > 0 && (
                          <div className="mt-2 flex gap-2 flex-wrap">
                            {review.image_urls.map((url, idx) => (
                              <img key={idx} src={url} alt="Review" className="h-12 w-12 rounded-lg object-cover border border-slate-200" />
                            ))}
                          </div>
                        )}

                        {review.seller_reply && (
                          <div className="mt-3 rounded-lg bg-primary/5 p-2.5 text-xs text-primary/80">
                            <span className="font-semibold block mb-1">Đã phản hồi: </span>
                            <span className="line-clamp-2">{review.seller_reply}</span>
                          </div>
                        )}

                        {review.deleted_at && review.deleted_reason && (
                          <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                            <span className="font-semibold block mb-1">Đã xóa bởi Admin: </span>
                            <span className="line-clamp-2">{review.deleted_reason}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap align-top text-slate-500">
                        {formatDate(review.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right align-top">
                        <div className="flex flex-col gap-2 items-end">
                          <button
                            onClick={() => handleOpenReply(review)}
                            disabled={!isWithin48h || !!review.deleted_at}
                            className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                              isWithin48h && !review.deleted_at
                                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {review.seller_reply ? 'Sửa phản hồi' : 'Phản hồi'}
                          </button>
                          
                          {!review.deleted_at && (
                            <button
                              onClick={() => setReviewToDelete(review)}
                              className="w-full rounded-lg px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                              Xóa đánh giá
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {total > 0 && (
          <div className="border-t border-slate-100 p-4 flex justify-center">
            <Pagination page={page} totalPages={totalPages(total)} onPageChange={goToPage} />
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {activeReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl transition-all duration-300">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Phản hồi đánh giá</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-1">Khách hàng: {activeReview.user_name}</p>

            <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < activeReview.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic">"{activeReview.body}"</p>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Nội dung phản hồi</label>
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Nhập câu trả lời của bạn..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActiveReview(null)}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => submitReply({ reviewId: activeReview.id, reply: replyBody.trim() })}
                disabled={!replyBody.trim() || isSubmitting}
                className="flex-1 rounded-xl bg-primary py-2.5 font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu phản hồi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {reviewToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl transition-all duration-300">
            <h3 className="text-lg font-bold text-red-600 mb-1">Xóa đánh giá</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-1">Khách hàng: {reviewToDelete.user_name}</p>

            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3">
              <p className="text-sm text-red-700 italic line-clamp-2">"{reviewToDelete.body}"</p>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Lý do xóa (bắt buộc)</label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Nhập lý do xóa đánh giá này..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {deleteReason.trim().length > 0 && deleteReason.trim().length < 5 && (
                <p className="mt-1 text-xs text-red-500">Lý do quá ngắn, vui lòng nhập ít nhất 5 ký tự.</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setReviewToDelete(null)
                  setDeleteReason('')
                }}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => submitDelete({ reviewId: reviewToDelete.id, reason: deleteReason.trim() })}
                disabled={deleteReason.trim().length < 5 || isDeleting}
                className="flex-1 rounded-xl bg-red-500 py-2.5 font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? 'Đang xử lý...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

