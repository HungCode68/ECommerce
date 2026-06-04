import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ProductReviewSummary } from '@/types/product.types'

type ProductSpec = {
  label: string
  value: string
}

type ProductDescriptionTabsProps = {
  description?: string
  specs: ProductSpec[]
  reviews?: ProductReviewSummary
}

export function ProductDescriptionTabs({
  description,
  specs,
  reviews,
}: ProductDescriptionTabsProps) {
  const tabs = [
    { id: 'description', label: 'Mô tả sản phẩm' },
    { id: 'specs', label: 'Thông số kỹ thuật' },
    { id: 'reviews', label: 'Đánh giá' },
  ] as const

  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('description')
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
          </div>
          <div className="mb-5 flex items-end gap-3">
            <span className="text-4xl font-bold text-[#1c1b1b]">{reviews?.avg_rating?.toFixed(1) || '0.0'}</span>
            <span className="pb-1 text-sm text-[#4a4455]">/ 5 từ {reviews?.rating_count || 0} đánh giá</span>
          </div>



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
                  
                  {review.seller_reply && (
                    <div className="mt-4 rounded-xl bg-[#f9f9f9] p-4 text-sm text-[#1c1b1b]">
                      <div className="flex items-center gap-2 mb-2 font-semibold">
                        <span className="material-symbols-outlined text-[18px] text-[#630ed4]">store</span>
                        <span>Phản hồi của người bán</span>
                      </div>
                      <p className="text-[#4a4455]">{review.seller_reply}</p>
                    </div>
                  )}
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
