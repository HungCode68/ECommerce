import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'
import type { Product } from '@/types/product.types'
import { ProductListingCard } from './ProductListingCard'

type ProductGridProps = {
  products: Product[]
  isLoading?: boolean
  viewMode?: 'grid' | 'list'
}

export function ProductGrid({
  products,
  isLoading = false,
  viewMode = 'grid',
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-[#ccc3d8] bg-white p-4">
            <div className="mb-4 h-40 rounded-lg bg-slate-200" />
            <LoadingSkeleton rows={3} />
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#ccc3d8] bg-white">
        <EmptyState
          title="Không tìm thấy sản phẩm"
          description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
          className="py-20"
        />
      </div>
    )
  }

  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4'
          : 'grid grid-cols-1 gap-4'
      }
    >
      {products.map((product) => (
        <ProductListingCard key={product.id} product={product} viewMode={viewMode} />
      ))}
    </div>
  )
}
