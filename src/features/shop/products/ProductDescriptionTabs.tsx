import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Star, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CreateReviewRequest, ProductReviewSummary } from '@/types/product.types'

type ProductSpec = {
  label: string
  value: string
}

type ProductDescriptionTabsProps = {
  description?: string
  specs: ProductSpec[]
  reviews?: ProductReviewSummary
  onSubmitReview?: (payload: CreateReviewRequest) => void
  onUploadReviewImage?: (file: File) => void
  reviewSubmitting?: boolean
  reviewUploading?: boolean
}

export function ProductDescriptionTabs({
  description,
  specs,
  reviews,
  onSubmitReview,
  onUploadReviewImage,
  reviewSubmitting = false,
  reviewUploading = false,
}: ProductDescriptionTabsProps) {
  const tabs = [
    { id: 'description', label: 'Mô tả sản phẩm' },
    { id: 'specs', label: 'Thông số kỹ thuật' },
    { id: 'reviews', label: 'Đánh giá' },
  ] as const

  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('description')
  const [isWritingReview, setIsWritingReview] = useState(false)
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const handleUploaded = (event: Event) => {
      const customEvent = event as CustomEvent<string>
      const url = customEvent.detail
      if (!url) return
      setImageUrls((current) => (current.includes(url) ? current : [...current, url]))
    }

    window.addEventListener('product-review-image-uploaded', handleUploaded as EventListener)
    return () => window.removeEventListener('product-review-image-uploaded', handleUploaded as EventListener)
  }, [])

  const handleReviewSubmit = () => {
    if (!body.trim() || body.trim().length < 15 || !onSubmitReview) return

    onSubmitReview({
      rating,
      body: body.trim(),
      performance_rating: rating,
      battery_rating: rating,
      camera_rating: rating,
      image_urls: imageUrls,
    })
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap gap-2 border-b border-[#e5e2e1]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'border-b-2 px-4 py-3 text-sm font-semibold transition',
              activeTab === tab.id
                ? 'border-[#630ed4] text-[#630ed4]'
                : 'border-transparent text-[#4a4455] hover:text-[#630ed4]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'description' ? (
        <div className="rounded-2xl border border-[#ccc3d8] bg-white p-5">
          <h3 className="mb-4 text-xl font-semibold text-[#1c1b1b]">Mô tả sản phẩm</h3>
          <p className="whitespace-pre-line text-sm leading-7 text-[#4a4455]">
            {description?.trim() || 'Thông tin mô tả sản phẩm đang được cập nhật.'}
          </p>
        </div>
      ) : null}

      {activeTab === 'specs' ? (
        <div className="overflow-hidden rounded-2xl border border-[#ccc3d8] bg-white">
          <h3 className="border-b border-[#e5e2e1] px-5 py-4 text-xl font-semibold text-[#1c1b1b]">
            Thông số kỹ thuật
          </h3>
          <div className="divide-y divide-[#e5e2e1]">
            {specs.length > 0 ? (
              specs.map((spec) => (
                <div key={spec.label} className="grid gap-2 px-5 py-4 md:grid-cols-[220px_1fr]">
                  <div className="text-sm font-medium text-[#4a4455]">{spec.label}</div>
                  <div className="text-sm text-[#1c1b1b]">{spec.value}</div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-[#4a4455]">Chưa có thông số kỹ thuật chi tiết.</div>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === 'reviews' ? (
        <div className="rounded-2xl border border-[#ccc3d8] bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-[#1c1b1b]">Đánh giá sản phẩm</h3>
            <button
              type="button"
              onClick={() => setIsWritingReview((current) => !current)}
              className="rounded-xl bg-[#630ed4] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {isWritingReview ? 'Đóng form' : 'Đánh giá sản phẩm'}
            </button>
          </div>
          <div className="mb-5 flex items-end gap-3">
            <span className="text-4xl font-bold text-[#1c1b1b]">{reviews?.avg_rating?.toFixed(1) || '0.0'}</span>
            <span className="pb-1 text-sm text-[#4a4455]">/ 5 từ {reviews?.rating_count || 0} đánh giá</span>
          </div>

          {isWritingReview ? (
            <div className="mb-6 rounded-2xl border border-[#e5e2e1] bg-[#fcf9f8] p-4">
              <h4 className="mb-4 text-lg font-semibold text-[#1c1b1b]">Đánh giá sản phẩm</h4>

              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-[#4a4455]">Số sao</p>
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className="text-amber-400 transition hover:scale-105"
                        aria-label={`${value} sao`}
                      >
                        <Star className={cn('h-6 w-6', value <= rating ? 'fill-current' : 'fill-transparent')} />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-[#4a4455]">Bình luận</p>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm thực tế của bạn về sản phẩm này..."
                  className="min-h-28 w-full rounded-xl border border-[#ccc3d8] bg-white px-4 py-3 text-sm text-[#1c1b1b] outline-none transition focus:border-[#630ed4] focus:ring-2 focus:ring-[#630ed4]/15"
                />
                {body.trim().length > 0 && body.trim().length < 15 ? (
                  <p className="mt-2 text-xs text-[#ba1a1a]">Bình luận tối thiểu 15 ký tự.</p>
                ) : null}
              </div>

              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[#4a4455]">Thêm ảnh</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#ccc3d8] bg-white px-3 py-2 text-sm text-[#1c1b1b] transition hover:border-[#630ed4] hover:text-[#630ed4]"
                  >
                    {reviewUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    Tải ảnh lên
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file || !onUploadReviewImage) return
                    onUploadReviewImage(file)
                    e.currentTarget.value = ''
                  }}
                />
                {imageUrls.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {imageUrls.map((url) => (
                      <div key={url} className="relative overflow-hidden rounded-xl border border-[#ccc3d8] bg-white p-1">
                        <img src={url} alt="Review upload" className="h-20 w-20 rounded-lg object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrls((current) => current.filter((item) => item !== url))}
                          className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                          aria-label="Xóa ảnh"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleReviewSubmit}
                  disabled={reviewSubmitting || body.trim().length < 15}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#630ed4] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reviewSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Gửi đánh giá
                </button>
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            {reviews?.reviews?.length ? (
              reviews.reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="border-t border-[#e5e2e1] pt-4 first:border-t-0 first:pt-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#630ed4] text-sm font-bold text-white">
                      {review.user_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1c1b1b]">{review.user_name}</p>
                      <p className="text-xs text-[#4a4455]">{review.rating}/5 sao</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#4a4455]">{review.body || 'Người dùng chưa để lại nhận xét.'}</p>
                  {review.image_urls?.length ? (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {review.image_urls.map((url) => (
                        <img key={url} src={url} alt="Review" className="h-20 w-20 rounded-lg border border-[#ccc3d8] object-cover" />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-[#4a4455]">Chưa có đánh giá cho sản phẩm này.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}
