import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productApi } from '@/api/product.api'
import { queryKeys } from '@/lib/queryKeys'
import { ProductCard } from '@/features/shop/products/ProductCard'
import { ProductFilter } from '@/features/shop/products/ProductFilter'
import { SearchInput } from '@/components/shared/SearchInput'
import { Pagination } from '@/components/shared/Pagination'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { usePagination } from '@/hooks/usePagination'
import { SlidersHorizontal } from 'lucide-react'

export function ProductsPage() {
  const { page, limit, totalPages, goToPage } = usePagination({ initialLimit: 16 })
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<number | undefined>()
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showFilter, setShowFilter] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.products.list({ q: search, page, limit, category_id: category }),
    queryFn: () =>
      productApi.search({ q: search, page, limit, category_id: category }),
  })

  const products = data?.data ?? []
  const total = data?.pagination?.total ?? 0
  const pages = totalPages(total)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Sản phẩm</h1>
          <p className="text-sm text-slate-500">{total} sản phẩm</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput onSearch={(v) => { setSearch(v); goToPage(1) }} placeholder="Tìm sản phẩm..." className="w-48" />
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Lọc
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filter sidebar */}
        <div className={`shrink-0 md:block ${showFilter ? 'block' : 'hidden'} w-52`}>
          <ProductFilter
            selectedCategory={category}
            onCategoryChange={(id) => { setCategory(id); goToPage(1) }}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={(min, max) => { setMinPrice(min); setMaxPrice(max) }}
          />
        </div>

        {/* Product grid */}
        <div className="flex-1">
          {isLoading ? (
            <CardSkeleton count={12} />
          ) : products.length === 0 ? (
            <EmptyState title="Không tìm thấy sản phẩm" description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              <div className="mt-8 flex justify-center">
                <Pagination page={page} totalPages={pages} onPageChange={goToPage} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
