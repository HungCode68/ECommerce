import { ArrowDownUp, Grid2X2, List } from 'lucide-react'

type ProductSortBarProps = {
  total: number
  sort: string
  onSortChange: (value: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  onOpenFilters: () => void
}

export function ProductSortBar({
  total,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenFilters,
}: ProductSortBarProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl border border-[#ccc3d8] bg-white p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[#1c1b1b]">
          Hiển thị <span className="font-bold">{total}</span> sản phẩm
        </p>
        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex items-center gap-2 rounded-lg border border-[#ccc3d8] px-3 py-2 text-sm font-medium text-[#1c1b1b] md:hidden"
        >
          <ArrowDownUp className="h-4 w-4" />
          Bộ lọc
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#4a4455]">Sắp xếp:</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-lg border border-[#ccc3d8] bg-[#f6f3f2] px-3 py-2 text-sm text-[#1c1b1b] outline-none transition focus:border-[#630ed4] focus:ring-2 focus:ring-[#630ed4]/15"
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá thấp đến cao</option>
            <option value="price_desc">Giá cao đến thấp</option>
            <option value="popular">Phổ biến nhất</option>
          </select>
        </div>

        <div className="hidden items-center overflow-hidden rounded-lg border border-[#ccc3d8] sm:flex">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`p-2 transition ${viewMode === 'grid' ? 'bg-[#630ed4]/10 text-[#630ed4]' : 'text-[#4a4455] hover:bg-[#f6f3f2]'}`}
            aria-label="Chế độ lưới"
          >
            <Grid2X2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`p-2 transition ${viewMode === 'list' ? 'bg-[#630ed4]/10 text-[#630ed4]' : 'text-[#4a4455] hover:bg-[#f6f3f2]'}`}
            aria-label="Chế độ danh sách"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
