import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type FilterOption = {
  label: string
  value: string
}

type CategoryOption = {
  id: number
  name: string
}

type ProductFiltersProps = {
  categories: CategoryOption[]
  selectedCategory?: number
  onCategoryChange: (id?: number) => void
  brands: string[]
  selectedBrands: string[]
  onBrandToggle: (brand: string) => void
  priceRange: string
  onPriceRangeChange: (value: string) => void
  ramOptions: FilterOption[]
  selectedRam: string[]
  onRamToggle: (value: string) => void
  colorOptions: FilterOption[]
  selectedColors: string[]
  onColorToggle: (value: string) => void
  onReset: () => void
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

const priceOptions: FilterOption[] = [
  { label: 'Dưới 5 triệu', value: 'under_5m' },
  { label: '5 - 10 triệu', value: '5m_10m' },
  { label: '10 - 20 triệu', value: '10m_20m' },
  { label: 'Trên 20 triệu', value: 'over_20m' },
]

const colorClassMap: Record<string, string> = {
  black: 'bg-black',
  midnight: 'bg-slate-900',
  silver: 'bg-slate-200',
  gray: 'bg-slate-400',
  grey: 'bg-slate-400',
  white: 'bg-white',
  gold: 'bg-amber-200',
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  purple: 'bg-violet-500',
  violet: 'bg-violet-500',
  red: 'bg-red-500',
  pink: 'bg-pink-400',
}

function ProductFiltersPanel({
  brands,
  selectedBrands,
  onBrandToggle,
  priceRange,
  onPriceRangeChange,
  ramOptions,
  selectedRam,
  onRamToggle,
  colorOptions,
  selectedColors,
  onColorToggle,
  onReset,
}: Omit<ProductFiltersProps, 'mobileOpen' | 'onCloseMobile'>) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#ccc3d8] bg-white">
      <div className="flex items-center justify-between border-b border-[#f0eded] p-4">
        <h2 className="text-lg font-semibold text-[#1c1b1b]">Bộ lọc</h2>
        <button type="button" onClick={onReset} className="text-sm font-semibold text-[#630ed4] hover:underline">
          Xóa tất cả
        </button>
      </div>

      <div className="space-y-8 p-4">
        <section>
          <h3 className="mb-3 text-lg font-semibold text-[#1c1b1b]">Thương hiệu</h3>
          <div className="space-y-2">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 text-sm text-[#4a4455]">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => onBrandToggle(brand)}
                  className="h-4 w-4 rounded border-[#ccc3d8] text-[#630ed4] focus:ring-[#630ed4]"
                />
                {brand}
              </label>
            ))}
            {brands.length === 0 ? <p className="text-sm text-[#7b7487]">Chưa có dữ liệu thương hiệu</p> : null}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-semibold text-[#1c1b1b]">Khoảng giá</h3>
          <div className="space-y-2">
            {priceOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-[#4a4455]">
                <input
                  type="radio"
                  checked={priceRange === option.value}
                  onChange={() => onPriceRangeChange(option.value)}
                  className="h-4 w-4 border-[#ccc3d8] text-[#630ed4] focus:ring-[#630ed4]"
                />
                {option.label}
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-semibold text-[#1c1b1b]">RAM</h3>
          <div className="flex flex-wrap gap-2">
            {ramOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onRamToggle(option.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition',
                  selectedRam.includes(option.value)
                    ? 'border-[#630ed4] bg-[#630ed4]/5 text-[#630ed4]'
                    : 'border-[#ccc3d8] text-[#4a4455] hover:border-[#630ed4] hover:text-[#630ed4]',
                )}
              >
                {option.label}
              </button>
            ))}
            {ramOptions.length === 0 ? <p className="text-sm text-[#7b7487]">Filter RAM chưa có dữ liệu</p> : null}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-semibold text-[#1c1b1b]">Màu sắc</h3>
          <div className="flex flex-wrap gap-3">
            {colorOptions.map((option) => {
              const colorKey = option.value.toLowerCase()
              const colorClass = colorClassMap[colorKey] ?? 'bg-slate-300'

              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.label}
                  onClick={() => onColorToggle(option.value)}
                  className={cn(
                    'h-6 w-6 rounded-full border transition',
                    colorClass,
                    selectedColors.includes(option.value)
                      ? 'ring-2 ring-[#630ed4] ring-offset-2'
                      : 'border-[#ccc3d8]',
                  )}
                />
              )
            })}
            {colorOptions.length === 0 ? <p className="text-sm text-[#7b7487]">Filter màu chưa có dữ liệu</p> : null}
          </div>
        </section>
      </div>
    </div>
  )
}

export function ProductFilters({
  mobileOpen = false,
  onCloseMobile,
  ...props
}: ProductFiltersProps) {
  return (
    <>
      <aside className="hidden w-[250px] shrink-0 md:block">
        <ProductFiltersPanel {...props} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={onCloseMobile}
            aria-label="Đóng bộ lọc"
          />
          <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-[#fcf9f8] p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1c1b1b]">Bộ lọc sản phẩm</h2>
              <button type="button" onClick={onCloseMobile} className="rounded-lg border border-[#ccc3d8] p-2 text-[#4a4455]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ProductFiltersPanel {...props} />
          </div>
        </div>
      ) : null}
    </>
  )
}
