import { Star } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

export function ReviewsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Đánh giá</h1>
        <p className="text-sm text-slate-500">Khu vực quản lý đánh giá sản phẩm</p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <EmptyState
          title="Chưa có trang quản lý đánh giá"
          description="Module này chưa được triển khai trong hệ thống hiện tại."
          icon={<Star className="h-8 w-8" />}
        />
      </div>
    </div>
  )
}
