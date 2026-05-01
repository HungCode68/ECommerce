import { useQuery } from '@tanstack/react-query'
import { categoryApi } from '@/api/category.api'
import { queryKeys } from '@/lib/queryKeys'
import { cn } from '@/lib/utils'

type ProductFilterProps = {
  selectedCategory: number | undefined
  onCategoryChange: (id: number | undefined) => void
  minPrice: string
  maxPrice: string
  onPriceChange: (min: string, max: string) => void
}

export function ProductFilter({
  selectedCategory,
  onCategoryChange,
  minPrice,
  maxPrice,
  onPriceChange,
}: ProductFilterProps) {
  const { data: categories } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: categoryApi.getAll,
  })

  return (
    <aside className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Danh mục</h3>
        <div className="space-y-1">
          <button
            onClick={() => onCategoryChange(undefined)}
            className={cn(
              'flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors',
              !selectedCategory
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            Tất cả danh mục
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                'flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors',
                selectedCategory === cat.id
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Khoảng giá</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => onPriceChange(e.target.value, maxPrice)}
            placeholder="Từ"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-slate-400">–</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => onPriceChange(minPrice, e.target.value)}
            placeholder="Đến"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </aside>
  )
}
