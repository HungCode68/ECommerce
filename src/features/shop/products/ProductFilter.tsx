import { useQuery } from '@tanstack/react-query'
import { productApi } from '@/api/product.api'
import { queryKeys } from '@/lib/queryKeys'
import { cn } from '@/lib/utils'

type ProductFilterProps = {
  selectedCategory?: number
  onCategoryChange?: (id: number | undefined) => void
  selectedBrand?: string
  onBrandChange?: (brand: string | undefined) => void
  minPrice?: string
  maxPrice?: string
  onPriceChange?: (min: string, max: string) => void
}

export function ProductFilter({
  selectedCategory,
  onCategoryChange,
  selectedBrand,
  onBrandChange,
  minPrice = '0',
  maxPrice = '50M',
  onPriceChange,
}: ProductFilterProps) {
  // Fetch brands dynamically based on selected category
  const { data: brandData } = useQuery({
    queryKey: queryKeys.products.list({ category_id: selectedCategory, limit: 200 }),
    queryFn: () => productApi.search({ category_id: selectedCategory, limit: 200 }),
  })

  // Deduplicate and sort brands from fetched products
  const brands = Array.from(
    new Set(
      (brandData?.data ?? [])
        .map((p) => p.brand)
        .filter((b): b is string => !!b && b.trim() !== '')
    )
  ).sort()

  const handleReset = () => {
    if (onCategoryChange) onCategoryChange(undefined)
    if (onBrandChange) onBrandChange(undefined)
    if (onPriceChange) onPriceChange('', '')
  }
  return (
    <aside className="hidden lg:flex lg:col-span-3 flex-col gap-8 sticky top-32">
      <div className="flex items-center justify-between pb-4 border-b border-surface-variant">
        <h2 className="font-headline font-bold text-xl text-on-surface">Bộ lọc</h2>
        <button onClick={handleReset} className="text-primary font-body text-sm font-medium hover:text-primary-container transition-colors">Reset</button>
      </div>

      {/* Brand Filter */}
      <div className="flex flex-col gap-4">
        <h3 className="font-headline font-semibold text-lg text-on-surface">Thương hiệu</h3>
        <div className="flex flex-col gap-3 font-body text-body-md text-on-surface-variant">
          {/* Tất cả */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={cn("relative flex items-center justify-center w-5 h-5 rounded border transition-colors bg-surface-container-lowest", selectedBrand === undefined ? "border-primary bg-primary/5" : "border-outline-variant group-hover:border-primary")}>
              <input type="checkbox" className="opacity-0 absolute inset-0 cursor-pointer" checked={selectedBrand === undefined} onChange={() => onBrandChange?.(undefined)} />
              <span className={cn("material-symbols-outlined text-[16px] text-primary transition-opacity", selectedBrand === undefined ? "opacity-100" : "opacity-0 group-hover:opacity-50")}>check</span>
            </div>
            <span className={cn("group-hover:text-primary transition-colors font-medium", selectedBrand === undefined && "text-primary")}>Tất cả</span>
          </label>

          {/* Dynamic brands from current category */}
          {brands.length === 0 ? (
            <span className="text-sm text-on-surface-variant opacity-50 italic">Chưa có thương hiệu nào</span>
          ) : (
            brands.map((brand) => (
              <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                <div className={cn("relative flex items-center justify-center w-5 h-5 rounded border transition-colors bg-surface-container-lowest", selectedBrand === brand ? "border-primary bg-primary/5" : "border-outline-variant group-hover:border-primary")}>
                  <input type="checkbox" className="opacity-0 absolute inset-0 cursor-pointer" checked={selectedBrand === brand} onChange={() => onBrandChange?.(brand)} />
                  <span className={cn("material-symbols-outlined text-[16px] text-primary transition-opacity", selectedBrand === brand ? "opacity-100" : "opacity-0 group-hover:opacity-50")}>check</span>
                </div>
                <span className={cn("group-hover:text-primary transition-colors font-medium", selectedBrand === brand && "text-primary")}>{brand}</span>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="flex flex-col gap-4">
        <h3 className="font-headline font-semibold text-lg text-on-surface">Giá</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Dưới 2 triệu', min: '0', max: '2000000' },
            { label: 'Từ 2 - 4 triệu', min: '2000000', max: '4000000' },
            { label: 'Từ 4 - 7 triệu', min: '4000000', max: '7000000' },
            { label: 'Từ 7 - 13 triệu', min: '7000000', max: '13000000' },
            { label: 'Từ 13 - 20 triệu', min: '13000000', max: '20000000' },
            { label: 'Trên 20 triệu', min: '20000000', max: '' },
          ].map((range) => {
            const isSelected = minPrice === range.min && maxPrice === range.max;
            return (
              <button
                key={range.label}
                onClick={() => onPriceChange?.(range.min, range.max)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border font-body text-sm transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary bg-surface-container-lowest"
                )}
              >
                {range.label}
              </button>
            )
          })}
        </div>
      </div>


    </aside>
  )
}
